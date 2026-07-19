const { z } = require("zod");
const { asyncHandler } = require("../middleware/asyncHandler");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { User } = require("../models/User");
const { VehicleListing } = require("../models/VehicleListing");
const { FinanceOffer } = require("../models/FinanceOffer");
const { Booking } = require("../models/Booking");
const { LoanRequest } = require("../models/LoanRequest");
const { getPaginationParams, formatPaginationResponse } = require("../utils/pagination");

function adminUsersRoutes(env) {
  const router = require("express").Router();

  router.use(auth(env), requireRole("admin"));

  router.get(
    "/users",
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const [items, total] = await Promise.all([
        User.find({}).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        User.countDocuments({})
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  router.post(
    "/users/:id/suspend",
    asyncHandler(async (req, res) => {
      const params = z.object({ id: z.string().min(1) }).safeParse(req.params);
      const body = z.object({ suspended: z.boolean() }).safeParse(req.body);
      if (!params.success || !body.success) throw new HttpError(400, "Invalid input");

      const user = await User.findById(params.data.id);
      if (!user) throw new HttpError(404, "Not found");
      if (user.role === "admin") throw new HttpError(400, "Cannot suspend admin");

      user.status = body.data.suspended ? "suspended" : "active";
      await user.save();
      return res.json({ item: { id: user._id.toString(), status: user.status } });
    })
  );

  router.delete(
    "/users/:id",
    asyncHandler(async (req, res) => {
      const params = z.object({ id: z.string().min(1) }).safeParse(req.params);
      if (!params.success) throw new HttpError(400, "Invalid input");

      const user = await User.findById(params.data.id);
      if (!user) throw new HttpError(404, "Not found");
      if (user.role === "admin") throw new HttpError(400, "Cannot delete admin");

      await User.deleteOne({ _id: user._id });
      return res.json({ ok: true });
    })
  );

  router.get(
    "/users/:id/audit",
    asyncHandler(async (req, res) => {
      const params = z.object({ id: z.string().min(1) }).safeParse(req.params);
      if (!params.success) throw new HttpError(400, "Invalid input");

      // Validate ObjectId format to avoid CastError
      const mongoose = require("mongoose");
      if (!mongoose.Types.ObjectId.isValid(params.data.id)) {
        throw new HttpError(400, "Invalid user ID format");
      }

      const user = await User.findById(params.data.id).lean();
      if (!user) throw new HttpError(404, "User not found");

      // Fetch from all collections in parallel
      const [vehicles, offers, bookings, loans] = await Promise.all([
        VehicleListing.find({ ownerId: user._id }).populate("approvedBy", "name").lean(),
        FinanceOffer.find({ lenderId: user._id }).populate("approvedBy", "name").lean(),
        Booking.find({ buyerId: user._id }).populate("approvedBy", "name").lean(),
        LoanRequest.find({ buyerId: user._id }).populate("approvedBy", "name").lean()
      ]);

      const auditTrail = [];

      vehicles.forEach(v => auditTrail.push({
        id: v._id.toString(),
        type: "Vehicle",
        details: `${v.brand || ""} ${v.model || ""} (${v.year || ""})`.trim() || "Vehicle Listing",
        submittedAt: v.createdAt,
        updatedAt: v.updatedAt,
        adminNote: v.adminNote || "",
        publicNote: v.publicNote || "",
        status: v.status,
        approvedBy: (v.approvedBy && v.approvedBy.name) ? v.approvedBy.name : "None"
      }));

      offers.forEach(o => auditTrail.push({
        id: o._id.toString(),
        type: "Finance Offer",
        details: `Min ₹${o.minLoan || 0} - Max ₹${o.maxLoan || 0} at ${o.interestRate || 0}%`,
        submittedAt: o.createdAt,
        updatedAt: o.updatedAt,
        adminNote: o.adminNote || "",
        publicNote: o.publicNote || "",
        status: o.status,
        approvedBy: (o.approvedBy && o.approvedBy.name) ? o.approvedBy.name : "None"
      }));

      bookings.forEach(b => auditTrail.push({
        id: b._id.toString(),
        type: "Booking",
        details: b.pickupDate && b.returnDate
          ? `${new Date(b.pickupDate).toISOString().split('T')[0]} to ${new Date(b.returnDate).toISOString().split('T')[0]}`
          : "Booking",
        submittedAt: b.createdAt,
        updatedAt: b.updatedAt,
        adminNote: b.adminNote || "",
        publicNote: b.publicNote || "",
        status: b.status,
        approvedBy: (b.approvedBy && b.approvedBy.name) ? b.approvedBy.name : "None"
      }));

      loans.forEach(l => auditTrail.push({
        id: l._id.toString(),
        type: "Loan Request",
        details: `Requested ₹${l.requestedAmount || 0}`,
        submittedAt: l.createdAt,
        updatedAt: l.updatedAt,
        adminNote: l.internalNotes || "",
        publicNote: l.publicNote || "",
        status: l.status,
        approvedBy: (l.approvedBy && l.approvedBy.name) ? l.approvedBy.name : "None"
      }));

      // Sort by descending updatedAt (most recent first)
      auditTrail.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      return res.json({
        user: {
          id: user._id.toString(),
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "",
          registrationDate: user.createdAt,
          status: user.status || "active"
        },
        auditTrail
      });
    })
  );

  return router;
}

module.exports = { adminUsersRoutes };
