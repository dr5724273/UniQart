const mongoose = require("mongoose");

const vehicleListingSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicleType: { type: String, required: true, enum: ["car", "bike"] },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    city: { type: String, required: true, trim: true, index: true },
    pricePerDay: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    images: [{ type: String }],
    availability: [
      {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
      }
    ],
    status: { type: String, required: true, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: { type: String }
  },
  { timestamps: true }
);

vehicleListingSchema.index({ status: 1, createdAt: -1 });
vehicleListingSchema.index({ ownerId: 1, createdAt: -1 });
vehicleListingSchema.index({ status: 1, city: 1, vehicleType: 1, pricePerDay: 1, createdAt: -1 });

const VehicleListing = mongoose.model("VehicleListing", vehicleListingSchema);

module.exports = { VehicleListing };

