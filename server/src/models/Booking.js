const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "VehicleListing", required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    pickupDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    address: { type: String, required: true },
    status: { type: String, required: true, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: { type: String },
    publicNote: { type: String }
  },
  { timestamps: true }
);

bookingSchema.index({ buyerId: 1, createdAt: -1 });
bookingSchema.index({ listerId: 1, createdAt: -1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ vehicleId: 1, status: 1, pickupDate: 1, returnDate: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = { Booking };

