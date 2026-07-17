const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["buyer", "lister", "admin"] },
    status: { type: String, required: true, enum: ["active", "suspended"], default: "active" }
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, status: 1 });

const User = mongoose.model("User", userSchema);

module.exports = { User };

