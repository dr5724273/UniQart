const assert = require("assert");
const mongoose = require("mongoose");
const { VehicleListing } = require("../src/models/VehicleListing");
const { User } = require("../src/models/User");
const { vehiclesRoutes } = require("../src/routes/vehicles");
const { escapeRegExp } = require("../src/utils/regex");

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
    }
  };
  return res;
}

// Helper to invoke route directly given req
async function runRoute(router, method, path, reqData) {
  return new Promise((resolve, reject) => {
    const req = {
      method: method.toUpperCase(),
      url: path,
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
  console.log("=== STARTING P0-06 REGEX DOS PROTECTION & REGRESSION TEST SUITE ===");
  await mongoose.connect("mongodb://127.0.0.1:27017/uniqart_regex_test");
  await Promise.all([VehicleListing.deleteMany({}), User.deleteMany({})]);
  await Promise.all([VehicleListing.createIndexes(), User.createIndexes()]);

  const mockEnv = { UPLOAD_DIR: "uploads" };
  const router = vehiclesRoutes(mockEnv);

  const owner = await User.create({ name: "Owner", email: "owner@test.com", password: "hash", phone: "1111111111", role: "lister" });
  await VehicleListing.create({
    ownerId: owner._id,
    vehicleType: "car",
    brand: "Toyota (Camry+Special)",
    model: "Camry",
    year: 2022,
    city: "New York",
    pricePerDay: 50,
    securityDeposit: 200,
    status: "approved"
  });

  console.log("\n[TEST 1] Escape Unit Test Verification...");
  assert.strictEqual(escapeRegExp("(((a+)+)+)+$"), "\\(\\(\\(a\\+\\)\\+\\)\\+\\)\\+\\$");
  assert.strictEqual(escapeRegExp("Toyota.*"), "Toyota\\.\\*");
  console.log("-> Passed: Special characters properly escaped.");

  console.log("\n[TEST 2] ReDoS Adversarial Input Route Test...");
  const start = Date.now();
  const resReDoS = await runRoute(router, "get", "/", {
    query: { brand: "(((a+)+)+)+$" }
  });
  const elapsed = Date.now() - start;
  assert.strictEqual(resReDoS.statusCode, 200);
  assert.strictEqual(resReDoS.body.items.length, 0);
  assert.ok(elapsed < 100, `Expected ReDoS query to complete in under 100ms, took ${elapsed}ms`);
  console.log(`-> Passed: ReDoS attack safely neutralized in ${elapsed}ms.`);

  console.log("\n[TEST 3] Preserved Prefix Search with Special Characters...");
  const resMatch = await runRoute(router, "get", "/", {
    query: { brand: "toyota (camry+" }
  });
  assert.strictEqual(resMatch.statusCode, 200);
  assert.strictEqual(resMatch.body.items.length, 1);
  assert.strictEqual(resMatch.body.items[0].brand, "Toyota (Camry+Special)");
  console.log("-> Passed: Search functionality preserved and matches brands with special characters accurately.");

  await mongoose.disconnect();
  console.log("\n=== ALL P0-06 REGEX DOS PROTECTION TESTS PASSED 100% ===");
}

if (require.main === module) {
  runAllTests().catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
}

module.exports = { runAllTests };
