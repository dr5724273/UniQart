const assert = require("assert");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Booking } = require("../src/models/Booking");
const { VehicleListing } = require("../src/models/VehicleListing");
const { User } = require("../src/models/User");
const { bookingsRoutes } = require("../src/routes/bookings");
const { HttpError } = require("../src/utils/httpError");

// Mock Express req/res environment for route testing
function createMockRes(resolve) {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      if (resolve) resolve(this);
      return this;
    },
    send(data) {
      this.body = data;
      if (resolve) resolve(this);
      return this;
    }
  };
  return res;
}

// Helper to invoke route directly given req
async function runRoute(router, method, path, reqData, env) {
  return new Promise((resolve, reject) => {
    const token = reqData.user ? jwt.sign({ sub: reqData.user._id.toString() }, env.JWT_SECRET) : null;
    const req = {
      method: method.toUpperCase(),
      url: path,
      headers: reqData.headers || (token ? { authorization: `Bearer ${token}` } : {}),
      cookies: reqData.cookies || {},
      query: reqData.query || {},
      params: reqData.params || {},
      body: reqData.body || {},
      user: reqData.user || {}
    };
    const res = createMockRes(resolve);

    // Find matching route handler
    const layer = router.stack.find(
      (l) => l.route && l.route.path === path && l.route.methods[method.toLowerCase()]
    );
    if (!layer) return reject(new Error(`Route not found: ${method} ${path}`));

    // Execute middleware chain in order
    const handlers = layer.route.stack.map((s) => s.handle);
    let idx = 0;
    function next(err) {
      if (err) return reject(err);
      if (idx >= handlers.length) return resolve(res);
      const fn = handlers[idx++];
      try {
        fn(req, res, next);
      } catch (e) {
        reject(e);
      }
    }
    next();
  });
}

async function runAllTests() {
  console.log("=== STARTING P0-03 INTEGRATION & REGRESSION TEST SUITE ===");
  await mongoose.connect("mongodb://127.0.0.1:27017/uniqart_bookings_test");
  await Promise.all([Booking.deleteMany({}), VehicleListing.deleteMany({}), User.deleteMany({})]);
  await Promise.all([Booking.createIndexes(), VehicleListing.createIndexes(), User.createIndexes()]);

  const mockEnv = { UPLOAD_DIR: "uploads", JWT_SECRET: "test_secret_key" };
  const router = bookingsRoutes(mockEnv);

  // 1. Create mock users & approved vehicle
  const owner = await User.create({ name: "Owner", email: "owner@test.com", password: "hash", phone: "1111111111", role: "lister" });
  const buyer1 = await User.create({ name: "Buyer 1", email: "buyer1@test.com", password: "hash", phone: "2222222222", role: "buyer" });
  const buyer2 = await User.create({ name: "Buyer 2", email: "buyer2@test.com", password: "hash", phone: "3333333333", role: "buyer" });
  const admin = await User.create({ name: "Admin", email: "admin@test.com", password: "hash", phone: "4444444444", role: "admin" });

  const vehicle = await VehicleListing.create({
    ownerId: owner._id,
    vehicleType: "car",
    brand: "Toyota",
    model: "Camry",
    year: 2022,
    city: "New York",
    pricePerDay: 50,
    securityDeposit: 200,
    status: "approved"
  });

  const now = Date.now();
  const day1 = new Date(now + 86400000 * 1); // Tomorrow
  const day5 = new Date(now + 86400000 * 5); // 5 days from now
  const day8 = new Date(now + 86400000 * 8); // 8 days from now
  const day10 = new Date(now + 86400000 * 10); // 10 days from now

  console.log("\n[TEST 1] Successful Booking Creation...");
  const res1 = await runRoute(router, "post", "/", {
    user: buyer1,
    body: {
      vehicleId: vehicle._id.toString(),
      pickupDate: day1.toISOString(),
      returnDate: day5.toISOString(),
      address: "123 Main Street"
    }
  }, mockEnv);
  assert.strictEqual(res1.statusCode, 201);
  assert.strictEqual(res1.body.item.status, "pending");
  console.log("-> Passed: Booking created successfully (status: 201 Created).");

  console.log("\n[TEST 2] Overlapping Booking Attempt (Should throw 409 Conflict)...");
  try {
    await runRoute(router, "post", "/", {
      user: buyer2,
      body: {
        vehicleId: vehicle._id.toString(),
        pickupDate: new Date(now + 86400000 * 2).toISOString(), // day 2 (inside day 1 to day 5)
        returnDate: new Date(now + 86400000 * 4).toISOString(),
        address: "456 Oak Avenue"
      }
    }, mockEnv);
    assert.fail("Should have thrown 409 Conflict");
  } catch (err) {
    assert.strictEqual(err.status, 409);
    assert.strictEqual(err.message, "Vehicle is already booked for the selected date range");
    console.log("-> Passed: Overlapping booking blocked with 409 Conflict.");
  }

  console.log("\n[TEST 3] Edge Date Boundaries (Adjacency Check)...");
  // Booking exactly from returnDate (day 5) to day 8 should NOT overlap [day 1, day 5]
  const resBoundary = await runRoute(router, "post", "/", {
    user: buyer2,
    body: {
      vehicleId: vehicle._id.toString(),
      pickupDate: day5.toISOString(),
      returnDate: day8.toISOString(),
      address: "789 Pine Road"
    }
  }, mockEnv);
  assert.strictEqual(resBoundary.statusCode, 201);
  console.log("-> Passed: Adjacent booking starting right at previous returnDate allowed without overlap.");

  console.log("\n[TEST 4] Concurrent Booking Attempts...");
  // Try 3 simultaneous requests for [day 8, day 10]
  const reqA = runRoute(router, "post", "/", {
    user: buyer1,
    body: { vehicleId: vehicle._id.toString(), pickupDate: day8.toISOString(), returnDate: day10.toISOString(), address: "Concurrent 1" }
  }, mockEnv);
  const reqB = runRoute(router, "post", "/", {
    user: buyer2,
    body: { vehicleId: vehicle._id.toString(), pickupDate: day8.toISOString(), returnDate: day10.toISOString(), address: "Concurrent 2" }
  }, mockEnv);
  const reqC = runRoute(router, "post", "/", {
    user: buyer1,
    body: { vehicleId: vehicle._id.toString(), pickupDate: day8.toISOString(), returnDate: day10.toISOString(), address: "Concurrent 3" }
  }, mockEnv);

  const results = await Promise.allSettled([reqA, reqB, reqC]);
  const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.statusCode === 201);
  const conflicts = results.filter((r) => r.status === "rejected" && r.reason.status === 409);
  assert.strictEqual(succeeded.length, 1, `Expected exactly 1 success, got ${succeeded.length}`);
  assert.strictEqual(conflicts.length, 2, `Expected exactly 2 conflicts, got ${conflicts.length}`);
  console.log("-> Passed: Concurrent requests safely controlled (1 succeeded, 2 blocked with 409 Conflict).");

  console.log("\n[TEST 5] Approval Race Condition...");
  // Simulate two pending bookings that were historically inserted overlapping each other
  const historicalA = await Booking.create({
    vehicleId: vehicle._id,
    buyerId: buyer1._id,
    listerId: owner._id,
    pickupDate: new Date(now + 86400000 * 20),
    returnDate: new Date(now + 86400000 * 25),
    address: "Historical A",
    status: "pending"
  });
  const historicalB = await Booking.create({
    vehicleId: vehicle._id,
    buyerId: buyer2._id,
    listerId: owner._id,
    pickupDate: new Date(now + 86400000 * 22),
    returnDate: new Date(now + 86400000 * 27),
    address: "Historical B",
    status: "pending"
  });

  // Admin approves historicalA -> succeeds
  const approveA = await runRoute(router, "post", "/admin/:id/decision", {
    user: admin,
    params: { id: historicalA._id.toString() },
    body: { action: "approve", adminNote: "Approved A" }
  }, mockEnv);
  assert.strictEqual(approveA.statusCode, 200);
  assert.strictEqual(approveA.body.item.status, "approved");

  // Admin attempts to approve historicalB -> should throw 409 Conflict due to overlapping approved A
  try {
    await runRoute(router, "post", "/admin/:id/decision", {
      user: admin,
      params: { id: historicalB._id.toString() },
      body: { action: "approve", adminNote: "Approved B" }
    }, mockEnv);
    assert.fail("Should have thrown 409 Conflict during approval");
  } catch (err) {
    assert.strictEqual(err.status, 409);
    assert.strictEqual(err.message, "Vehicle already has an approved booking for this date range");
    console.log("-> Passed: Approval race condition prevented; overlapping approval blocked with 409 Conflict.");
  }

  console.log("\n[TEST 6] Mongo explain() Index Usage Verification...");
  const overlapQuery = {
    vehicleId: vehicle._id,
    status: { $in: ["pending", "approved"] },
    pickupDate: { $lt: day5 },
    returnDate: { $gt: day1 }
  };
  const explainResult = await Booking.findOne(overlapQuery).explain("executionStats");
  const winning = explainResult.queryPlanner?.winningPlan;
  function getStages(plan) {
    let stages = [];
    if (plan.stage) stages.push(plan.stage);
    if (plan.inputStage) stages = stages.concat(getStages(plan.inputStage));
    if (plan.inputStages) plan.inputStages.forEach((s) => (stages = stages.concat(getStages(s))));
    return stages;
  }
  const stages = getStages(winning);
  console.log("-> Query Plan Stages:", stages.join(" -> "));
  assert.ok(stages.includes("IXSCAN"), "Expected IXSCAN stage in winning plan");
  console.log("-> Passed: Overlap query uses IXSCAN index (vehicleId_1_status_1_pickupDate_1_returnDate_1).");

  await mongoose.disconnect();
  console.log("\n=== ALL P0-03 INTEGRATION & REGRESSION TESTS PASSED 100% ===");
}

if (require.main === module) {
  runAllTests().catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
}

module.exports = { runAllTests };
