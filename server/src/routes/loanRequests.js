const { z } = require("zod");
const { asyncHandler } = require("../middleware/asyncHandler");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { LoanRequest } = require("../models/LoanRequest");
const { FinanceOffer } = require("../models/FinanceOffer");
const { createUpload } = require("../config/upload");
const { getPaginationParams, formatPaginationResponse } = require("../utils/pagination");
const { uploadLimiter } = require("../middleware/rateLimiter");
const { runInTransaction, withFinanceLock } = require("../utils/tx");
const { emitAdminNotification } = require("../socket");

function loanRequestsRoutes(env) {
  const router = require("express").Router();
  const upload = createUpload(env.UPLOAD_DIR, "loan-documents");

  // Buyer: apply for loan
  router.post(
    "/",
    auth(env),
    requireRole("buyer"),
    uploadLimiter,
    upload.array("documents", 8),
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          financeOfferId: z.string().min(1),
          requestedAmount: z.coerce.number().positive(),
          durationMonths: z.coerce.number().int().positive(),
          employmentStatus: z.string().min(2).max(80),
          monthlyIncome: z.coerce.number().nonnegative(),
          collateralType: z.enum(["vehicle", "property", "gold", "other"]),
          collateralDescription: z.string().min(5).max(2000)
        })
        .safeParse(req.body);
      if (!body.success) {
        console.error("Loan Request validation failed:", body.error.errors);
        throw new HttpError(400, "Invalid input: " + JSON.stringify(body.error.errors));
      }

      const offer = await FinanceOffer.findById(body.data.financeOfferId).lean();
      if (!offer || offer.status !== "approved") throw new HttpError(404, "Offer not available");
      if (body.data.requestedAmount < offer.minLoan || body.data.requestedAmount > offer.maxLoan)
        throw new HttpError(400, "Requested amount must be within offer range");
      if (!Array.isArray(offer.durationMonths) || !offer.durationMonths.includes(body.data.durationMonths))
        throw new HttpError(400, "Selected duration is not available for this offer");

      const documents = (req.files || []).map((f) => `/${env.UPLOAD_DIR}/loan-documents/${f.filename}`);

      const item = await LoanRequest.create({
        financeOfferId: offer._id,
        buyerId: req.user._id,
        lenderId: offer.lenderId,
        requestedAmount: body.data.requestedAmount,
        durationMonths: body.data.durationMonths,
        employmentStatus: body.data.employmentStatus,
        monthlyIncome: body.data.monthlyIncome,
        collateralType: body.data.collateralType,
        collateralDescription: body.data.collateralDescription,
        documents
      });

      emitAdminNotification({
        id: `notif-loan-${item._id}-${Date.now()}`,
        type: "loan_request",
        title: "New Loan Request",
        message: `Loan request of ₹${item.requestedAmount} submitted for approval.`,
        url: "/admin/dashboard?tab=loans",
        createdAt: new Date().toISOString()
      });

      return res.status(201).json({ item });
    })
  );

  // Buyer: my requests
  router.get(
    "/mine",
    auth(env),
    requireRole("buyer"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const filter = { buyerId: req.user._id };
      const [items, total] = await Promise.all([
        LoanRequest.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate({
            path: "financeOfferId",
            populate: { path: "lenderId", select: "name" }
          })
          .lean(),
        LoanRequest.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Lister: requests to me (as lender)
  router.get(
    "/lender",
    auth(env),
    requireRole("lister"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const filter = { lenderId: req.user._id };
      const [items, total] = await Promise.all([
        LoanRequest.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("buyerId", "name email phone")
          .populate("financeOfferId")
          .lean(),
        LoanRequest.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Admin: all loan requests
  router.get(
    "/admin",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const [items, total] = await Promise.all([
        LoanRequest.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("buyerId", "name email phone")
          .populate("lenderId", "name email phone")
          .populate("financeOfferId")
          .lean(),
        LoanRequest.countDocuments({})
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
        LoanRequest.find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("buyerId", "name email phone")
          .populate("lenderId", "name email phone")
          .lean(),
        LoanRequest.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Admin: pending loan requests
  router.get(
    "/admin/pending",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const filter = { status: "pending" };
      const [items, total] = await Promise.all([
        LoanRequest.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("buyerId", "name email phone")
          .populate("lenderId", "name email phone")
          .populate("financeOfferId")
          .lean(),
        LoanRequest.countDocuments(filter)
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
          internalNotes: z.string().max(2000).optional(),
          publicNote: z.string().max(2000).optional()
        })
        .safeParse(req.body);
      if (!params.success || !body.success) throw new HttpError(400, "Invalid input");

      const item = await runInTransaction(async (session) => {
        const target = await LoanRequest.findById(params.data.id).session(session).lean();
        if (!target) throw new HttpError(404, "Not found");

        return await withFinanceLock(target.financeOfferId, async () => {
          if (body.data.action === "approve" && target.status !== "approved") {
            const offer = await FinanceOffer.findOneAndUpdate(
              { _id: target.financeOfferId },
              { $set: { updatedAt: new Date() } },
              { new: true, session }
            ).lean();
            if (!offer || offer.status !== "approved") {
              throw new HttpError(404, "Finance offer not available");
            }

            const approvedLoans = await LoanRequest.find({
              financeOfferId: target.financeOfferId,
              status: "approved",
              _id: { $ne: target._id }
            }).session(session).lean();

            const allocatedAmount = approvedLoans.reduce((sum, loan) => sum + loan.requestedAmount, 0);
            const availableAmount = offer.totalAmount - allocatedAmount;
            if (target.requestedAmount > availableAmount) {
              throw new HttpError(409, "Insufficient funds available in the Finance Offer pool");
            }
          }

          const request = await LoanRequest.findById(params.data.id).session(session);
          if (!request) throw new HttpError(404, "Not found");

          request.status = body.data.action === "approve" ? "approved" : "rejected";
          request.internalNotes = body.data.internalNotes || "";
          request.publicNote = body.data.publicNote || "";
          request.approvedBy = req.user._id;
          await request.save({ session });

          return request;
        });
      });

      return res.json({ item });
    })
  );

  return router;
}

module.exports = { loanRequestsRoutes };
