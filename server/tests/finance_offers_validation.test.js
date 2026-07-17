const assert = require("assert");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { FinanceOffer } = require("../src/models/FinanceOffer");
const { User } = require("../src/models/User");
const { financeOffersRoutes } = require("../src/routes/financeOffers");

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
  console.log("=== STARTING P0-04 FINANCE OFFERS VALIDATION & REGRESSION TEST SUITE ===");
  await mongoose.connect("mongodb://127.0.0.1:27017/uniqart_finance_test");
  await Promise.all([FinanceOffer.deleteMany({}), User.deleteMany({})]);
  await Promise.all([FinanceOffer.createIndexes(), User.createIndexes()]);

  const mockEnv = { UPLOAD_DIR: "uploads", JWT_SECRET: "test_secret_key" };
  const router = financeOffersRoutes(mockEnv);

  const lister = await User.create({ name: "Lender", email: "lender@test.com", password: "hash", phone: "5555555555", role: "lister" });

  console.log("\n[TEST 1] Successful Finance Offer Creation with Deduplicated/Sorted Durations...");
  const res1 = await runRoute(router, "post", "/", {
    user: lister,
    body: {
      totalAmount: 100000,
      minLoan: 10000,
      maxLoan: 50000,
      interestRate: 12.5,
      durationMonths: [12, 3, 6, 3], // Unsorted with duplicate 3
      collateralRequired: "vehicle",
      terms: "Valid financing terms description."
    }
  }, mockEnv);
  assert.strictEqual(res1.statusCode, 201);
  assert.deepStrictEqual(res1.body.item.durationMonths, [3, 6, 12]);
  assert.strictEqual(res1.body.item.status, "pending");
  console.log("-> Passed: Finance offer created with sorted & deduplicated durations [3, 6, 12].");

  console.log("\n[TEST 2] Edge-Case: Pure Whitespace Terms (Should reject after trimming)...");
  try {
    await runRoute(router, "post", "/", {
      user: lister,
      body: {
        totalAmount: 100000,
        minLoan: 10000,
        maxLoan: 50000,
        interestRate: 12,
        durationMonths: [3, 6],
        collateralRequired: "vehicle",
        terms: "          " // 10 spaces
      }
    }, mockEnv);
    assert.fail("Should have rejected pure whitespace terms");
  } catch (err) {
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.message, "Invalid input");
    console.log("-> Passed: Pure whitespace terms rejected cleanly.");
  }

  console.log("\n[TEST 3] Edge-Case: Invalid Duration Options...");
  try {
    await runRoute(router, "post", "/", {
      user: lister,
      body: {
        totalAmount: 100000,
        minLoan: 10000,
        maxLoan: 50000,
        interestRate: 12,
        durationMonths: [3, 24], // 24 is not allowed
        collateralRequired: "vehicle",
        terms: "Valid financing terms description."
      }
    }, mockEnv);
    assert.fail("Should have rejected invalid duration 24");
  } catch (err) {
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.message, "Invalid duration options: allowed durations are 3, 6, and 12 months");
    console.log("-> Passed: Invalid duration options blocked with explicit error message.");
  }

  console.log("\n[TEST 4] Edge-Case: Min Loan Exceeding Total Amount...");
  try {
    await runRoute(router, "post", "/", {
      user: lister,
      body: {
        totalAmount: 50000,
        minLoan: 60000,
        maxLoan: 80000,
        interestRate: 12,
        durationMonths: [3, 6],
        collateralRequired: "vehicle",
        terms: "Valid financing terms description."
      }
    }, mockEnv);
    assert.fail("Should have rejected minLoan > totalAmount");
  } catch (err) {
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.message, "Min loan cannot exceed total amount");
    console.log("-> Passed: minLoan > totalAmount correctly prevented.");
  }

  console.log("\n[TEST 5] Edge-Case: Max Loan Exceeding Total Amount...");
  try {
    await runRoute(router, "post", "/", {
      user: lister,
      body: {
        totalAmount: 50000,
        minLoan: 10000,
        maxLoan: 60000,
        interestRate: 12,
        durationMonths: [3, 6],
        collateralRequired: "vehicle",
        terms: "Valid financing terms description."
      }
    }, mockEnv);
    assert.fail("Should have rejected maxLoan > totalAmount");
  } catch (err) {
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.message, "Max loan cannot exceed total amount");
    console.log("-> Passed: maxLoan > totalAmount correctly prevented.");
  }

  console.log("\n[TEST 6] Edge-Case: Min Loan Exceeding Max Loan...");
  try {
    await runRoute(router, "post", "/", {
      user: lister,
      body: {
        totalAmount: 100000,
        minLoan: 40000,
        maxLoan: 20000,
        interestRate: 12,
        durationMonths: [3, 6],
        collateralRequired: "vehicle",
        terms: "Valid financing terms description."
      }
    }, mockEnv);
    assert.fail("Should have rejected minLoan > maxLoan");
  } catch (err) {
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.message, "Min loan cannot exceed max loan");
    console.log("-> Passed: minLoan > maxLoan correctly prevented.");
  }

  await mongoose.disconnect();
  console.log("\n=== ALL P0-04 FINANCE OFFERS VALIDATION TESTS PASSED 100% ===");
}

if (require.main === module) {
  runAllTests().catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
}

module.exports = { runAllTests };
