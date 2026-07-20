const { z } = require("zod");
const { asyncHandler } = require("../middleware/asyncHandler");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { VehicleListing } = require("../models/VehicleListing");
const { createUpload } = require("../config/upload");
const { getPaginationParams, formatPaginationResponse } = require("../utils/pagination");
const { escapeRegExp } = require("../utils/regex");
const { uploadLimiter } = require("../middleware/rateLimiter");
const { emitAdminNotification } = require("../socket");

function vehiclesRoutes(env) {
  const router = require("express").Router();
  const upload = createUpload(env.UPLOAD_DIR, "vehicle-images");

  // Public browse (approved only)
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const query = z
        .object({
          city: z.string().max(100).optional(),
          vehicleType: z.enum(["car", "bike"]).optional(),
          brand: z.string().max(100).optional(),
          minPrice: z.coerce.number().optional(),
          maxPrice: z.coerce.number().optional()
        })
        .safeParse(req.query);
      if (!query.success) throw new HttpError(400, "Invalid filters");

      const filter = { status: "approved", isOffline: { $ne: true } };
      if (query.data.city) filter.city = query.data.city;
      if (query.data.vehicleType) filter.vehicleType = query.data.vehicleType;
      if (query.data.brand) filter.brand = new RegExp(`^${escapeRegExp(query.data.brand)}`, "i");
      if (query.data.minPrice != null || query.data.maxPrice != null) {
        filter.pricePerDay = {};
        if (query.data.minPrice != null) filter.pricePerDay.$gte = query.data.minPrice;
        if (query.data.maxPrice != null) filter.pricePerDay.$lte = query.data.maxPrice;
      }

      const { page, limit, skip } = getPaginationParams(req.query);
      const [items, total] = await Promise.all([
        VehicleListing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        VehicleListing.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Lister create listing (pending admin approval)
  router.post(
    "/",
    auth(env),
    requireRole("lister"),
    uploadLimiter,
    upload.array("images", 8),
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          vehicleType: z.enum(["car", "bike"]),
          brand: z.string().min(1),
          model: z.string().min(1),
          year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
          city: z.string().min(1),
          pricePerDay: z.coerce.number().positive(),
          securityDeposit: z.coerce.number().nonnegative(),
          availability: z
            .string()
            .optional()
            .transform((v) => (v ? JSON.parse(v) : []))
        })
        .safeParse(req.body);
      if (!body.success) throw new HttpError(400, "Invalid input");

      const images = (req.files || []).map((f) => `/${env.UPLOAD_DIR}/vehicle-images/${f.filename}`);

      const listing = await VehicleListing.create({
        ownerId: req.user._id,
        vehicleType: body.data.vehicleType,
        brand: body.data.brand,
        model: body.data.model,
        year: body.data.year,
        city: body.data.city,
        pricePerDay: body.data.pricePerDay,
        securityDeposit: body.data.securityDeposit,
        images,
        availability: Array.isArray(body.data.availability) ? body.data.availability : []
      });

      emitAdminNotification({
        id: `notif-veh-${listing._id}-${Date.now()}`,
        type: "vehicle_listing",
        title: "New Vehicle Listing",
        message: `${listing.brand} ${listing.model} (${listing.year}) submitted for approval.`,
        url: "/admin/dashboard?tab=vehicles",
        createdAt: new Date().toISOString()
      });

      return res.status(201).json({ item: listing });
    })
  );

  // Lister: my listings
  router.get(
    "/mine",
    auth(env),
    requireRole("lister"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const filter = { ownerId: req.user._id };
      const [items, total] = await Promise.all([
        VehicleListing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        VehicleListing.countDocuments(filter)
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
        VehicleListing.find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("ownerId", "name email phone role")
          .lean(),
        VehicleListing.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Admin: pending listings
  router.get(
    "/admin/pending",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const filter = { status: "pending" };
      const [items, total] = await Promise.all([
        VehicleListing.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("ownerId", "name email phone role")
          .lean(),
        VehicleListing.countDocuments(filter)
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Admin: all listings
  router.get(
    "/admin/all",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPaginationParams(req.query);
      const [items, total] = await Promise.all([
        VehicleListing.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("ownerId", "name email phone role")
          .lean(),
        VehicleListing.countDocuments()
      ]);
      return res.json(formatPaginationResponse(items, total, page, limit));
    })
  );

  // Admin: toggle offline
  router.patch(
    "/admin/:id/offline",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const params = z.object({ id: z.string().min(1) }).safeParse(req.params);
      const body = z.object({ isOffline: z.boolean() }).safeParse(req.body);
      if (!params.success || !body.success) throw new HttpError(400, "Invalid input");

      const vehicle = await VehicleListing.findById(params.data.id);
      if (!vehicle) throw new HttpError(404, "Not found");

      vehicle.isOffline = body.data.isOffline;
      await vehicle.save();

      emitAdminNotification({
        id: `notif-veh-offline-${vehicle._id}-${Date.now()}`,
        type: "vehicle_update",
        title: "Vehicle Status Changed",
        message: `${vehicle.brand} ${vehicle.model} is now ${vehicle.isOffline ? 'OFFLINE' : 'ONLINE'}.`,
        url: "/admin/dashboard?tab=vehicles",
        createdAt: new Date().toISOString()
      });

      return res.json({ ok: true, isOffline: vehicle.isOffline });
    })
  );

  // Admin: delete listing
  router.delete(
    "/admin/:id",
    auth(env),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const params = z.object({ id: z.string().min(1) }).safeParse(req.params);
      if (!params.success) throw new HttpError(400, "Invalid input");

      const { Booking } = require("../models/Booking");
      const activeBookings = await Booking.countDocuments({
        vehicleId: params.data.id,
        status: "approved",
        returnDate: { $gte: new Date() }
      });

      if (activeBookings > 0) {
        throw new HttpError(409, "Cannot delete vehicle with active approved bookings");
      }

      const vehicle = await VehicleListing.findByIdAndDelete(params.data.id);
      if (!vehicle) throw new HttpError(404, "Not found");

      await Booking.deleteMany({ vehicleId: params.data.id, status: "pending" });

      emitAdminNotification({
        id: `notif-veh-del-${params.data.id}-${Date.now()}`,
        type: "vehicle_deleted",
        title: "Vehicle Deleted",
        message: `${vehicle.brand} ${vehicle.model} has been deleted by an admin.`,
        url: "/admin/dashboard?tab=vehicles",
        createdAt: new Date().toISOString()
      });

      return res.json({ ok: true });
    })
  );

  // Admin approve/reject
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
          publicNote: z.string().max(500).optional()
        })
        .safeParse(req.body);
      if (!params.success || !body.success) throw new HttpError(400, "Invalid input");

      const vehicle = await VehicleListing.findById(params.data.id);
      if (!vehicle) throw new HttpError(404, "Not found");

      vehicle.status = body.data.action === "approve" ? "approved" : "rejected";
      vehicle.adminNote = body.data.adminNote || "";
      vehicle.publicNote = body.data.publicNote || "";
      vehicle.approvedBy = req.user._id;
      await vehicle.save();

      return res.json({ item: vehicle });
    })
  );

  return router;
}

module.exports = { vehiclesRoutes };
