const mongoose = require("mongoose");

const loanRequestSchema = new mongoose.Schema(
  {
    financeOfferId: { type: mongoose.Schema.Types.ObjectId, ref: "FinanceOffer", required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lenderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requestedAmount: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    employmentStatus: { type: String, required: true, trim: true },
    monthlyIncome: { type: Number, required: true },
    collateralType: { type: String, required: true, enum: ["vehicle", "property", "gold", "other"] },
    collateralDescription: { type: String, required: true },
    documents: [{ type: String }],
    status: { type: String, required: true, enum: ["pending", "approved", "rejected"], default: "pending" },
    internalNotes: { type: String }
  },
  { timestamps: true }
);

loanRequestSchema.index({ buyerId: 1, createdAt: -1 });
loanRequestSchema.index({ lenderId: 1, createdAt: -1 });
loanRequestSchema.index({ createdAt: -1 });
loanRequestSchema.index({ financeOfferId: 1, status: 1 });

const LoanRequest = mongoose.model("LoanRequest", loanRequestSchema);

module.exports = { LoanRequest };
