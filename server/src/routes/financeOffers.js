const { z } = require("zod");
const { asyncHandler } = require("../middleware/asyncHandler");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { FinanceOffer } = require("../models/FinanceOffer");
const { getPaginationParams, formatPaginationResponse } = require("../utils/pagination");

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
          terms: z.string().trim().min(10).max(3000)
        })
        .safeParse(req.body);
      if (!body.success) throw new HttpError(400, "Invalid input");

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

  router.post(
    "/admin/:id/decision",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const params = z.object({ id: z.string().min(1) }).safeParse(req.params);
      const body = z
        .object({
          action: z.enum(["approve", "reject"]),
          adminNote: z.string().max(500).optional()
        })
        .safeParse(req.body);
      if (!params.success || !body.success) throw new HttpError(400, "Invalid input");

      const status = body.data.action === "approve" ? "approved" : "rejected";
      const item = await FinanceOffer.findByIdAndUpdate(
        params.data.id,
        { status, adminNote: body.data.adminNote || "" },
        { new: true }
      ).lean();
      if (!item) throw new HttpError(404, "Not found");
      return res.json({ item });
    })
  );

  return router;
}

module.exports = { financeOffersRoutes };
