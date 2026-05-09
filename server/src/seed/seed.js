require("dotenv").config();
const bcrypt = require("bcryptjs");
const { loadEnv } = require("../config/env");
const { connectDb } = require("../config/db");
const { User } = require("../models/User");
const { VehicleListing } = require("../models/VehicleListing");
const { FinanceOffer } = require("../models/FinanceOffer");

async function seed() {
  const env = loadEnv();
  await connectDb(env.MONGODB_URI);

  await Promise.all([User.deleteMany({}), VehicleListing.deleteMany({}), FinanceOffer.deleteMany({})]);

  const admin = await User.create({
    name: "UniQart Admin",
    email: "Admin12@gmail.com",
    phone: "+91-9999999999",
    password: await bcrypt.hash("Rajput57", 12),
    role: "admin"
  });

  const lister = await User.create({
    name: "Demo Lister",
    email: "lister@uniqart.app",
    phone: "+91-8888888888",
    password: await bcrypt.hash("Lister@12345", 12),
    role: "lister"
  });

  const buyer = await User.create({
    name: "Demo Buyer",
    email: "buyer@uniqart.app",
    phone: "+91-7777777777",
    password: await bcrypt.hash("Buyer@12345", 12),
    role: "buyer"
  });

  await VehicleListing.create({
    ownerId: lister._id,
    vehicleType: "car",
    brand: "Hyundai",
    model: "i20",
    year: 2021,
    city: "Bengaluru",
    pricePerDay: 1800,
    securityDeposit: 5000,
    images: [],
    availability: [{ startDate: new Date(), endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }],
    status: "approved",
    adminNote: "Seed approved"
  });

  await FinanceOffer.create({
    lenderId: lister._id,
    totalAmount: 200000,
    minLoan: 10000,
    maxLoan: 50000,
    interestRate: 18,
    durationMonths: [3, 6, 12],
    collateralRequired: "gold",
    terms: "KYC required. Collateral verification by UniQart admin. Interest payable monthly.",
    status: "approved",
    adminNote: "Seed approved"
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete:", {
    admin: admin.email,
    lister: lister.email,
    buyer: buyer.email
  });
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
