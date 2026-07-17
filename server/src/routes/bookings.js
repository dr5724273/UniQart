const { z } = require("zod");
const { asyncHandler } = require("../middleware/asyncHandler");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { Booking } = require("../models/Booking");
const { VehicleListing } = require("../models/VehicleListing");
const { getPaginationParams, formatPaginationResponse } = require("../utils/pagination");
const { runInTransaction, withVehicleLock } = require("../utils/tx");

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

      // Validate pickup date is not in the past (allowing 60s clock drift)
      if (body.data.pickupDate.getTime() < Date.now() - 60000) {
        throw new HttpError(400, "Pickup date cannot be in the past");
      }

      const booking = await withVehicleLock(body.data.vehicleId, async () => {
        return await runInTransaction(async (session) => {
          const vehicle = await VehicleListing.findById(body.data.vehicleId).session(session).lean();
          if (!vehicle || vehicle.status !== "approved") throw new HttpError(404, "Vehicle not available");
          if (vehicle.ownerId.toString() === req.user._id.toString()) {
            throw new HttpError(403, "Owner cannot book their own vehicle");
          }

          // Check for overlapping pending or approved bookings
          const overlapQuery = {
            vehicleId: vehicle._id,
            status: { $in: ["pending", "approved"] },
            pickupDate: { $lt: body.data.returnDate },
            returnDate: { $gt: body.data.pickupDate }
          };
          const existingOverlap = await Booking.findOne(overlapQuery).session(session).lean();
          if (existingOverlap) {
            throw new HttpError(409, "Vehicle is already booked for the selected date range");
          }

          const [created] = await Booking.create(
            [
              {
                vehicleId: vehicle._id,
                buyerId: req.user._id,
                listerId: vehicle.ownerId,
                pickupDate: body.data.pickupDate,
                returnDate: body.data.returnDate,
                address: body.data.address
              }
            ],
            { session }
          );
          return created;
        });
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
      const { page, limit, skip } = getPaginationParams(req.query);
      const filter = { buyerId: req.user._id };
      const [items, total] = await Promise.all([
        Booking.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("vehicleId")
          .lean(),
        Booking.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Lister: bookings for my vehicles
  router.get(
    "/lister",
    auth(env),
    requireRole("lister"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const filter = { listerId: req.user._id };
      const [items, total] = await Promise.all([
        Booking.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("vehicleId")
          .populate("buyerId", "name email phone")
          .lean(),
        Booking.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Admin: all bookings
  router.get(
    "/admin",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const [items, total] = await Promise.all([
        Booking.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("vehicleId")
          .populate("buyerId", "name email phone")
          .populate("listerId", "name email phone")
          .lean(),
        Booking.countDocuments({})
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
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

      const item = await runInTransaction(async (session) => {
        const target = await Booking.findById(params.data.id).session(session).lean();
        if (!target) throw new HttpError(404, "Not found");

        return await withVehicleLock(target.vehicleId, async () => {
          if (body.data.action === "approve") {
            const overlapQuery = {
              _id: { $ne: target._id },
              vehicleId: target.vehicleId,
              status: "approved",
              pickupDate: { $lt: target.returnDate },
              returnDate: { $gt: target.pickupDate }
            };
            const existingApproved = await Booking.findOne(overlapQuery).session(session).lean();
            if (existingApproved) {
              throw new HttpError(409, "Vehicle already has an approved booking for this date range");
            }
          }

          const status = body.data.action === "approve" ? "approved" : "rejected";
          const updated = await Booking.findByIdAndUpdate(
            params.data.id,
            { status, adminNote: body.data.adminNote || "" },
            { new: true, session }
          ).lean();
          if (!updated) throw new HttpError(404, "Not found");
          return updated;
        });
      });

      return res.json({ item });
    })
  );

  return router;
}

module.exports = { bookingsRoutes };
