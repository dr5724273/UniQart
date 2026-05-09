const { z } = require("zod");
const { asyncHandler } = require("../middleware/asyncHandler");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { Booking } = require("../models/Booking");
const { VehicleListing } = require("../models/VehicleListing");

function bookingsRoutes(env) {
  const router = require("express").Router();

  // Buyer: create booking
  router.post(
    "/",
    auth(env),
    requireRole("buyer"),
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          vehicleId: z.string().min(1),
          pickupDate: z.coerce.date(),
          returnDate: z.coerce.date(),
          address: z.string().min(5).max(500)
        })
        .safeParse(req.body);
      if (!body.success) throw new HttpError(400, "Invalid input");
      if (body.data.returnDate <= body.data.pickupDate) throw new HttpError(400, "Return date must be after pickup date");

      const vehicle = await VehicleListing.findById(body.data.vehicleId).lean();
      if (!vehicle || vehicle.status !== "approved") throw new HttpError(404, "Vehicle not available");

      const booking = await Booking.create({
        vehicleId: vehicle._id,
        buyerId: req.user._id,
        listerId: vehicle.ownerId,
        pickupDate: body.data.pickupDate,
        returnDate: body.data.returnDate,
        address: body.data.address
      });

      return res.status(201).json({ item: booking });
    })
  );

  // Buyer: my bookings
  router.get(
    "/mine",
    auth(env),
    requireRole("buyer"),
    asyncHandler(async (req, res) => {
      const items = await Booking.find({ buyerId: req.user._id })
        .sort({ createdAt: -1 })
        .populate("vehicleId")
        .lean();
      return res.json({ items });
    })
  );

  // Lister: bookings for my vehicles
  router.get(
    "/lister",
    auth(env),
    requireRole("lister"),
    asyncHandler(async (req, res) => {
      const items = await Booking.find({ listerId: req.user._id })
        .sort({ createdAt: -1 })
        .populate("vehicleId")
        .populate("buyerId", "name email phone")
        .lean();
      return res.json({ items });
    })
  );

  // Admin: all bookings
  router.get(
    "/admin",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (_req, res) => {
      const items = await Booking.find({})
        .sort({ createdAt: -1 })
        .populate("vehicleId")
        .populate("buyerId", "name email phone")
        .populate("listerId", "name email phone")
        .lean();
      return res.json({ items });
    })
  );

  // Admin: approve/reject
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
      const item = await Booking.findByIdAndUpdate(
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

module.exports = { bookingsRoutes };
