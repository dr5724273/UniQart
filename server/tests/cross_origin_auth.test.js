const assert = require("assert");
const mongoose = require("mongoose");
const { createApp } = require("../src/app");
const { User } = require("../src/models/User");
const { VehicleListing } = require("../src/models/VehicleListing");
const { FinanceOffer } = require("../src/models/FinanceOffer");
const { LoanRequest } = require("../src/models/LoanRequest");
const http = require("http");

async function runAllTests() {
  console.log("=== STARTING CROSS-ORIGIN AUTHENTICATION & PROTECTED API TEST SUITE ===");
  await mongoose.connect("mongodb://127.0.0.1:27017/uniqart_auth_test");
  await Promise.all([
    User.deleteMany({}),
    VehicleListing.deleteMany({}),
    FinanceOffer.deleteMany({}),
    LoanRequest.deleteMany({})
  ]);

  const env = {
    NODE_ENV: "development",
    PORT: 5099,
    MONGODB_URI: "mongodb://127.0.0.1:27017/uniqart_auth_test",
    JWT_SECRET: "test_secret_for_auth_suite_verification",
    JWT_EXPIRES_IN: "1d",
    CORS_ORIGIN: "http://localhost:3000",
    UPLOAD_DIR: "uploads",
    HTTP_LOG: "off"
  };

  const app = createApp(env);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Test server listening on port ${port}...`);

  // 1. Create test users directly in DB
  const bcrypt = require("bcryptjs");
  const hash = await bcrypt.hash("Password123!", 10);
  const lister = await User.create({
    name: "Lister User",
    email: "lister@auth.test",
    phone: "1234567890",
    password: hash,
    role: "lister"
  });
  const buyer = await User.create({
    name: "Buyer User",
    email: "buyer@auth.test",
    phone: "0987654321",
    password: hash,
    role: "buyer"
  });

  console.log("\n[TEST 1] Verify Login and Cookie Attributes (SameSite=Lax; Secure=false in development)...");
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "lister@auth.test", password: "Password123!" })
  });
  assert.strictEqual(loginRes.status, 200);
  const setCookieHeader = loginRes.headers.get("set-cookie");
  assert.ok(setCookieHeader, "Set-Cookie header should be present on login response");
  assert.ok(setCookieHeader.toLowerCase().includes("samesite=lax"), "Cookie must specify SameSite=Lax in development");
  assert.ok(!setCookieHeader.toLowerCase().includes("secure"), "Cookie must not specify Secure in development");
  console.log("-> Passed: Set-Cookie contains SameSite=Lax and secure=false in development.");

  // Extract raw cookie string to pass in Cookie header simulating browser with credentials: "include"
  const cookieStr = setCookieHeader.split(";")[0];

  console.log("\n[TEST 2] Verify Protected API: Create Finance Offer (`POST /api/finance-offers`)...");
  const createOfferRes = await fetch(`${baseUrl}/api/finance-offers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieStr
    },
    body: JSON.stringify({
      totalAmount: 100000,
      minLoan: 10000,
      maxLoan: 50000,
      interestRate: 12,
      durationMonths: [6, 12],
      collateralRequired: "vehicle",
      terms: "Standard verification terms required."
    })
  });
  const offerData = await createOfferRes.json();
  assert.strictEqual(createOfferRes.status, 201, `Expected 201, got ${createOfferRes.status}: ${JSON.stringify(offerData)}`);
  assert.ok(offerData.item && offerData.item._id, "Finance offer created successfully");
  console.log("-> Passed: Create Finance Offer authenticated and returned 201 Created.");

  console.log("\n[TEST 3] Verify Protected API: Create Vehicle Listing (`POST /api/vehicles`)...");
  const createVehicleRes = await fetch(`${baseUrl}/api/vehicles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieStr
    },
    body: JSON.stringify({
      vehicleType: "car",
      brand: "Toyota",
      model: "Camry",
      year: 2022,
      city: "San Francisco",
      pricePerDay: 85,
      securityDeposit: 500
    })
  });
  const vehicleData = await createVehicleRes.json();
  assert.strictEqual(createVehicleRes.status, 201, `Expected 201, got ${createVehicleRes.status}: ${JSON.stringify(vehicleData)}`);
  assert.ok(vehicleData.item && vehicleData.item._id, "Vehicle listing created successfully");
  console.log("-> Passed: Create Vehicle Listing authenticated and returned 201 Created.");

  // Now login as buyer to test Loan Request
  const buyerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "buyer@auth.test", password: "Password123!" })
  });
  const buyerCookieStr = buyerLoginRes.headers.get("set-cookie").split(";")[0];

  // Approve the finance offer first so buyer can apply
  await FinanceOffer.findByIdAndUpdate(offerData.item._id, { status: "approved" });

  console.log("\n[TEST 4] Verify Protected API: Create Loan Request (`POST /api/loan-requests`)...");
  const createLoanRes = await fetch(`${baseUrl}/api/loan-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: buyerCookieStr
    },
    body: JSON.stringify({
      financeOfferId: offerData.item._id,
      requestedAmount: 20000,
      durationMonths: 12,
      employmentStatus: "employed",
      monthlyIncome: 6000,
      collateralType: "vehicle",
      collateralDescription: "Toyota Camry 2022 collateral"
    })
  });
  const loanData = await createLoanRes.json();
  assert.strictEqual(createLoanRes.status, 201, `Expected 201, got ${createLoanRes.status}: ${JSON.stringify(loanData)}`);
  assert.ok(loanData.item && loanData.item._id, "Loan request created successfully");
  console.log("-> Passed: Create Loan Request authenticated and returned 201 Created.");

  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  console.log("\n=== ALL CROSS-ORIGIN AUTHENTICATION & PROTECTED API TESTS PASSED 100% ===");
}

if (require.main === module) {
  runAllTests().catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
}

module.exports = { runAllTests };
