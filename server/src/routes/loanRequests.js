const { z } = require("zod");
const { asyncHandler } = require("../middleware/asyncHandler");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { LoanRequest } = require("../models/LoanRequest");
const { FinanceOffer } = require("../models/FinanceOffer");
const { createUpload } = require("../config/upload");

function loanRequestsRoutes(env) {
  const router = require("express").Router();
  const upload = createUpload(env.UPLOAD_DIR, "loan-documents");

  // Buyer: apply for loan
  router.post(
    "/",
    auth(env),
    requireRole("buyer"),
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
      if (!body.success) throw new HttpError(400, "Invalid input");

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

      return res.status(201).json({ item });
    })
  );

  // Buyer: my requests
  router.get(
    "/mine",
    auth(env),
    requireRole("buyer"),
    asyncHandler(async (req, res) => {
      const items = await LoanRequest.find({ buyerId: req.user._id })
        .sort({ createdAt: -1 })
        .populate({
          path: "financeOfferId",
          populate: { path: "lenderId", select: "name" }
        })
        .lean();
      return res.json({ items });
    })
  );

  // Lister: requests to me (as lender)
  router.get(
    "/lender",
    auth(env),
    requireRole("lister"),
    asyncHandler(async (req, res) => {
      const items = await LoanRequest.find({ lenderId: req.user._id })
        .sort({ createdAt: -1 })
        .populate("buyerId", "name email phone")
        .populate("financeOfferId")
        .lean();
      return res.json({ items });
    })
  );

  // Admin: all loan requests
  router.get(
    "/admin",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (_req, res) => {
      const items = await LoanRequest.find({})
        .sort({ createdAt: -1 })
        .populate("buyerId", "name email phone")
        .populate("lenderId", "name email phone")
        .populate("financeOfferId")
        .lean();
      return res.json({ items });
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
          internalNotes: z.string().max(2000).optional()
        })
        .safeParse(req.body);
      if (!params.success || !body.success) throw new HttpError(400, "Invalid input");

      const status = body.data.action === "approve" ? "approved" : "rejected";
      const item = await LoanRequest.findByIdAndUpdate(
        params.data.id,
        { status, internalNotes: body.data.internalNotes || "" },
        { new: true }
      ).lean();
      if (!item) throw new HttpError(404, "Not found");
      return res.json({ item });
    })
  );

  return router;
}

module.exports = { loanRequestsRoutes };
