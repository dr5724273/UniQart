const mongoose = require("mongoose");

const financeOfferSchema = new mongoose.Schema(
  {
    lenderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    totalAmount: { type: Number, required: true },
    minLoan: { type: Number, required: true },
    maxLoan: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    durationMonths: [{ type: Number, enum: [3, 6, 12], required: true }],
    collateralRequired: { type: String, required: true, enum: ["vehicle", "property", "gold", "other"] },
    terms: { type: String, required: true },
    status: { type: String, required: true, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: { type: String },
    publicNote: { type: String }
  },
  { timestamps: true }
);

financeOfferSchema.index({ status: 1, createdAt: -1 });
financeOfferSchema.index({ lenderId: 1, createdAt: -1 });

const FinanceOffer = mongoose.model("FinanceOffer", financeOfferSchema);

module.exports = { FinanceOffer };

