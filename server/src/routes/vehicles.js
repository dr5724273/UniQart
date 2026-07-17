const { z } = require("zod");
const { asyncHandler } = require("../middleware/asyncHandler");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { VehicleListing } = require("../models/VehicleListing");
const { createUpload } = require("../config/upload");
const { getPaginationParams, formatPaginationResponse } = require("../utils/pagination");

function vehiclesRoutes(env) {
  const router = require("express").Router();
  const upload = createUpload(env.UPLOAD_DIR, "vehicle-images");

  // Public browse (approved only)
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const query = z
        .object({
          city: z.string().optional(),
          vehicleType: z.enum(["car", "bike"]).optional(),
          brand: z.string().optional(),
          minPrice: z.coerce.number().optional(),
          maxPrice: z.coerce.number().optional()
        })
        .safeParse(req.query);
      if (!query.success) throw new HttpError(400, "Invalid filters");

      const filter = { status: "approved" };
      if (query.data.city) filter.city = query.data.city;
      if (query.data.vehicleType) filter.vehicleType = query.data.vehicleType;
      if (query.data.brand) filter.brand = new RegExp(`^${query.data.brand}`, "i");
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
          adminNote: z.string().max(500).optional()
        })
        .safeParse(req.body);
      if (!params.success || !body.success) throw new HttpError(400, "Invalid input");

      const status = body.data.action === "approve" ? "approved" : "rejected";
      const item = await VehicleListing.findByIdAndUpdate(
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

module.exports = { vehiclesRoutes };
