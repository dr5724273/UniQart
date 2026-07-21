const { z } = require("zod");
const { asyncHandler } = require("../middleware/asyncHandler");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { FinanceOffer } = require("../models/FinanceOffer");
const { getPaginationParams, formatPaginationResponse } = require("../utils/pagination");
const { emitAdminNotification } = require("../socket");

function financeOffersRoutes(env) {
  const router = require("express").Router();

  // Public browse (approved only)
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const filter = { status: "approved" };
      const [items, total] = await Promise.all([
        FinanceOffer.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("lenderId", "name")
          .lean(),
        FinanceOffer.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Lister: create offer
  router.post(
    "/",
    auth(env),
    requireRole("lister"),
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          totalAmount: z.coerce.number().positive(),
          minLoan: z.coerce.number().positive(),
          maxLoan: z.coerce.number().positive(),
          interestRate: z.coerce.number().min(0).max(60),
          durationMonths: z.array(z.coerce.number().int()).min(1),
          collateralRequired: z.enum(["vehicle", "property", "gold", "other"]),
          terms: z.string().trim().min(10).max(3000),
          termsAccepted: z.boolean().optional().default(false)
        })
        .safeParse(req.body);
      if (!body.success) throw new HttpError(400, "Invalid input");
      if (!body.data.termsAccepted) throw new HttpError(400, "You must accept the Terms & Conditions to create a finance offer");

      if (body.data.minLoan > body.data.maxLoan) {
        throw new HttpError(400, "Min loan cannot exceed max loan");
      }
      if (body.data.minLoan > body.data.totalAmount) {
        throw new HttpError(400, "Min loan cannot exceed total amount");
      }
      if (body.data.maxLoan > body.data.totalAmount) {
        throw new HttpError(400, "Max loan cannot exceed total amount");
      }

      const allowedDurations = new Set([3, 6, 12]);
      const invalidDurations = body.data.durationMonths.filter((d) => !allowedDurations.has(d));
      if (invalidDurations.length > 0) {
        throw new HttpError(400, "Invalid duration options: allowed durations are 3, 6, and 12 months");
      }

      const durations = Array.from(new Set(body.data.durationMonths)).sort((a, b) => a - b);

      const item = await FinanceOffer.create({
        lenderId: req.user._id,
        totalAmount: body.data.totalAmount,
        minLoan: body.data.minLoan,
        maxLoan: body.data.maxLoan,
        interestRate: body.data.interestRate,
        durationMonths: durations,
        collateralRequired: body.data.collateralRequired,
        terms: body.data.terms
      });

      emitAdminNotification({
        id: `notif-off-${item._id}-${Date.now()}`,
        type: "finance_offer",
        title: "New Finance Offer",
        message: `Finance offer ₹${item.minLoan}–₹${item.maxLoan} (${item.interestRate}%) submitted for approval.`,
        url: "/admin/dashboard?tab=offers",
        createdAt: new Date().toISOString()
      });

      return res.status(201).json({ item });
    })
  );

  // Lister: my offers
  router.get(
    "/mine",
    auth(env),
    requireRole("lister"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const filter = { lenderId: req.user._id };
      const [items, total] = await Promise.all([
        FinanceOffer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        FinanceOffer.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Admin: history (approved/rejected)
  router.get(
    "/admin/history",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const filter = { status: { $in: ["approved", "rejected"] } };
      const [items, total] = await Promise.all([
        FinanceOffer.find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("lenderId", "name email phone")
          .lean(),
        FinanceOffer.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Admin: pending offers
  router.get(
    "/admin/pending",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const filter = { status: "pending" };
      const [items, total] = await Promise.all([
        FinanceOffer.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("lenderId", "name email phone role")
          .lean(),
        FinanceOffer.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Admin: all offers
  router.get(
    "/admin/all",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const [items, total] = await Promise.all([
        FinanceOffer.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("lenderId", "name email phone role")
          .lean(),
        FinanceOffer.countDocuments()
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Admin: delete offer
  router.delete(
    "/admin/:id",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const params = z.object({ id: z.string().min(1) }).safeParse(req.params);
      if (!params.success) throw new HttpError(400, "Invalid input");

      const { LoanRequest } = require("../models/LoanRequest");
      const activeLoans = await LoanRequest.countDocuments({
        financeOfferId: params.data.id,
        status: "approved"
      });

      if (activeLoans > 0) {
        throw new HttpError(409, "Cannot delete finance offer with active approved loans");
      }

      const offer = await FinanceOffer.findByIdAndDelete(params.data.id);
      if (!offer) throw new HttpError(404, "Not found");

      await LoanRequest.deleteMany({ financeOfferId: params.data.id, status: "pending" });

      emitAdminNotification({
        id: `notif-off-del-${params.data.id}-${Date.now()}`,
        type: "finance_offer_deleted",
        title: "Finance Offer Deleted",
        message: `A finance offer by lender ${offer.lenderId} was deleted.`,
        url: "/admin/dashboard?tab=offers",
        createdAt: new Date().toISOString()
      });

      return res.json({ ok: true });
    })
  );

  router.post(
    "/admin/:id/decision",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const params = z.object({ id: z.string().min(1) }).safeParse(req.params);
      const body = z
        .object({
          action: z.enum(["approve", "reject"]),
          adminNote: z.string().max(500).optional(),
          publicNote: z.string().max(500).optional(),
          overrideInterestRate: z.coerce.number().min(0).max(60).optional(),
          overrideTermsAndConditions: z.string().trim().max(3000).optional()
        })
        .safeParse(req.body);
      if (!params.success || !body.success) throw new HttpError(400, "Invalid input");

      const offer = await FinanceOffer.findById(params.data.id);
      if (!offer) throw new HttpError(404, "Not found");

      offer.status = body.data.action === "approve" ? "approved" : "rejected";
      if (body.data.action === "approve") {
        if (body.data.overrideInterestRate !== undefined) {
          offer.interestRate = body.data.overrideInterestRate;
        }
        if (body.data.overrideTermsAndConditions !== undefined && body.data.overrideTermsAndConditions !== "") {
          offer.terms = body.data.overrideTermsAndConditions;
        }
      }
      offer.adminNote = body.data.adminNote || "";
      offer.publicNote = body.data.publicNote || "";
      offer.approvedBy = req.user._id;
      await offer.save();

      return res.json({ item: offer });
    })
  );

  return router;
}

module.exports = { financeOffersRoutes };
