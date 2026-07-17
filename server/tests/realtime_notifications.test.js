const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { io: Client } = require("socket.io-client");
const { createApp } = require("../src/app");
const { initSocket } = require("../src/socket");
const { User } = require("../src/models/User");

const TEST_ENV = {
  NODE_ENV: "test",
  PORT: "0",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/uniqart_test_notifications",
  JWT_SECRET: "test_secret_for_notifications",
  CORS_ORIGIN: "http://localhost:3000",
  UPLOAD_DIR: "uploads",
  HTTP_LOG: "off"
};

test("Real-time Admin Notifications Suite", async (t) => {
  let httpServer;
  let port;
  let adminUser1;
  let adminUser2;
  let listerUser;
  let buyerUser;
  let adminToken1;
  let adminToken2;
  let listerToken;
  let buyerToken;

  t.before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_ENV.MONGODB_URI);
    }
    await mongoose.connection.db.dropDatabase();

    const app = createApp(TEST_ENV);
    httpServer = http.createServer(app);
    initSocket(httpServer, TEST_ENV);

    await new Promise((resolve) => httpServer.listen(0, resolve));
    port = httpServer.address().port;

    adminUser1 = await User.create({
      name: "Admin One",
      email: "admin1@uniqart.com",
      phone: "9999999001",
      password: "hash",
      role: "admin",
      status: "active"
    });
    adminToken1 = jwt.sign({ sub: adminUser1._id.toString(), role: "admin" }, TEST_ENV.JWT_SECRET);

    adminUser2 = await User.create({
      name: "Admin Two",
      email: "admin2@uniqart.com",
      phone: "9999999002",
      password: "hash",
      role: "admin",
      status: "active"
    });
    adminToken2 = jwt.sign({ sub: adminUser2._id.toString(), role: "admin" }, TEST_ENV.JWT_SECRET);

    listerUser = await User.create({
      name: "Lister Bob",
      email: "lister@uniqart.com",
      phone: "8888888001",
      password: "hash",
      role: "lister",
      status: "active"
    });
    listerToken = jwt.sign({ sub: listerUser._id.toString(), role: "lister" }, TEST_ENV.JWT_SECRET);

    buyerUser = await User.create({
      name: "Buyer Alice",
      email: "buyer@uniqart.com",
      phone: "7777777001",
      password: "hash",
      role: "buyer",
      status: "active"
    });
    buyerToken = jwt.sign({ sub: buyerUser._id.toString(), role: "buyer" }, TEST_ENV.JWT_SECRET);
  });

  t.after(async () => {
    if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  await t.test("Verify multiple admins connect and receive instant notifications for new creations", async () => {
    const socketUrl = `http://localhost:${port}`;
    const client1 = new Client(socketUrl, {
      auth: { token: adminToken1 },
      transports: ["websocket", "polling"]
    });
    const client2 = new Client(socketUrl, {
      auth: { token: adminToken2 },
      transports: ["websocket", "polling"]
    });

    const notifs1 = [];
    const notifs2 = [];

    client1.on("admin_notification", (data) => notifs1.push(data));
    client2.on("admin_notification", (data) => notifs2.push(data));

    await Promise.all([
      new Promise((resolve) => client1.on("connect", resolve)),
      new Promise((resolve) => client2.on("connect", resolve))
    ]);

    // Give a short moment for room joining in io.use middleware
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 1. Submit a new Vehicle Listing as Lister
    const vehRes = await fetch(`http://localhost:${port}/api/vehicles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${listerToken}`
      },
      body: JSON.stringify({
        vehicleType: "car",
        brand: "Tesla",
        model: "Model 3",
        year: 2024,
        city: "Mumbai",
        pricePerDay: 5000,
        securityDeposit: 10000
      })
    });
    assert.equal(vehRes.status, 201, "Vehicle creation failed");

    // Wait for notification delivery
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(notifs1.length, 1, "Admin 1 should receive exactly 1 notification for vehicle");
    assert.equal(notifs2.length, 1, "Admin 2 should receive exactly 1 notification for vehicle");
    assert.equal(notifs1[0].type, "vehicle_listing");
    assert.equal(notifs1[0].url, "/admin/dashboard?tab=vehicles");

    // 2. Submit a new Finance Offer as Lister
    const offRes = await fetch(`http://localhost:${port}/api/finance-offers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${listerToken}`
      },
      body: JSON.stringify({
        totalAmount: 500000,
        minLoan: 10000,
        maxLoan: 100000,
        interestRate: 10,
        durationMonths: [6, 12],
        collateralRequired: "vehicle",
        terms: "Standard financing terms apply."
      })
    });
    assert.equal(offRes.status, 201, "Finance offer creation failed");
    const offerJson = await offRes.json();

    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(notifs1.length, 2, "Admin 1 should receive 2nd notification");
    assert.equal(notifs2.length, 2, "Admin 2 should receive 2nd notification");
    assert.equal(notifs1[1].type, "finance_offer");
    assert.equal(notifs1[1].url, "/admin/dashboard?tab=offers");

    // First approve the finance offer so buyer can request loan
    await fetch(`http://localhost:${port}/api/finance-offers/admin/${offerJson.item._id}/decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken1}`
      },
      body: JSON.stringify({ action: "approve", adminNote: "OK" })
    });

    // 3. Submit a new Loan Request as Buyer
    const loanRes = await fetch(`http://localhost:${port}/api/loan-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        financeOfferId: offerJson.item._id,
        requestedAmount: 50000,
        durationMonths: 12,
        employmentStatus: "Employed",
        monthlyIncome: 80000,
        collateralType: "vehicle",
        collateralDescription: "2022 Honda City"
      })
    });
    assert.equal(loanRes.status, 201, "Loan request creation failed");

    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(notifs1.length, 3, "Admin 1 should receive 3rd notification");
    assert.equal(notifs2.length, 3, "Admin 2 should receive 3rd notification");
    assert.equal(notifs1[2].type, "loan_request");
    assert.equal(notifs1[2].url, "/admin/dashboard?tab=loans");

    client1.disconnect();
    client2.disconnect();
  });
});
