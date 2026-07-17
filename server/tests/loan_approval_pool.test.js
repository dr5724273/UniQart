const assert = require("assert");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { User } = require("../src/models/User");
const { FinanceOffer } = require("../src/models/FinanceOffer");
const { LoanRequest } = require("../src/models/LoanRequest");
const { loanRequestsRoutes } = require("../src/routes/loanRequests");

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

async function runRoute(router, method, path, reqData, env) {
  return new Promise((resolve, reject) => {
    const token = reqData.user && env?.JWT_SECRET ? jwt.sign({ sub: reqData.user._id.toString() }, env.JWT_SECRET) : null;
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

    const layer = router.stack.find((l) => {
      if (!l.route || !l.route.methods[method.toLowerCase()]) return false;
      const match = l.match(path);
      if (match && l.params) {
        req.params = Object.assign({}, req.params, l.params);
      }
      return Boolean(match);
    });
    if (!layer) return reject(new Error(`Route not found: ${method} ${path}`));

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
  console.log("=== STARTING LOAN APPROVAL POOL OVERDRAFT & CONCURRENCY TEST SUITE ===");
  await mongoose.connect("mongodb://127.0.0.1:27017/uniqart_loan_pool_test");
  await Promise.all([User.deleteMany({}), FinanceOffer.deleteMany({}), LoanRequest.deleteMany({})]);
  await Promise.all([User.createIndexes(), FinanceOffer.createIndexes(), LoanRequest.createIndexes()]);

  const mockEnv = { UPLOAD_DIR: "uploads", JWT_SECRET: "test_secret_key" };
  const router = loanRequestsRoutes(mockEnv);

  const admin = await User.create({ name: "Admin", email: "admin@test.com", password: "h", phone: "111", role: "admin" });
  const lender = await User.create({ name: "Lender", email: "lender@test.com", password: "h", phone: "222", role: "lister" });
  const buyer1 = await User.create({ name: "Buyer 1", email: "b1@test.com", password: "h", phone: "333", role: "buyer" });
  const buyer2 = await User.create({ name: "Buyer 2", email: "b2@test.com", password: "h", phone: "444", role: "buyer" });

  const offer = await FinanceOffer.create({
    lenderId: lender._id,
    totalAmount: 10000,
    minLoan: 1000,
    maxLoan: 10000,
    interestRate: 10,
    durationMonths: [6, 12],
    collateralRequired: "vehicle",
    terms: "Valid pool terms here.",
    status: "approved"
  });

  const loan1 = await LoanRequest.create({
    financeOfferId: offer._id,
    buyerId: buyer1._id,
    lenderId: lender._id,
    requestedAmount: 6000,
    durationMonths: 12,
    employmentStatus: "employed",
    monthlyIncome: 5000,
    collateralType: "vehicle",
    collateralDescription: "Car collateral"
  });

  const loan2 = await LoanRequest.create({
    financeOfferId: offer._id,
    buyerId: buyer2._id,
    lenderId: lender._id,
    requestedAmount: 6000,
    durationMonths: 12,
    employmentStatus: "employed",
    monthlyIncome: 5000,
    collateralType: "vehicle",
    collateralDescription: "Bike collateral"
  });

  console.log("\n[TEST 1] Successful Approval of Loan within Pool Limits...");
  const resApprove1 = await runRoute(router, "post", `/admin/${loan1._id}/decision`, {
    user: admin,
    params: { id: loan1._id.toString() },
    body: { action: "approve" }
  }, mockEnv);
  assert.strictEqual(resApprove1.statusCode, 200);
  assert.strictEqual(resApprove1.body.item.status, "approved");
  console.log("-> Passed: Loan 1 ($6,000) approved successfully out of $10,000 pool.");

  console.log("\n[TEST 2] Insufficient Pool Attempt & Rollback Verification...");
  // Loan 2 also asks for $6,000, but only $4,000 remains in pool ($10,000 - $6,000)
  try {
    await runRoute(router, "post", `/admin/${loan2._id}/decision`, {
      user: admin,
      params: { id: loan2._id.toString() },
      body: { action: "approve" }
    }, mockEnv);
    assert.fail("Should have thrown 409 Conflict due to insufficient funds");
  } catch (err) {
    assert.strictEqual(err.status, 409);
    assert.ok(err.message.includes("Insufficient funds"), `Unexpected message: ${err.message}`);
  }
  const freshLoan2 = await LoanRequest.findById(loan2._id);
  assert.strictEqual(freshLoan2.status, "pending", "Loan status should remain pending due to rollback/pre-condition failure");
  console.log("-> Passed: Loan 2 ($6,000) blocked with HTTP 409 Conflict and state preserved as pending.");

  console.log("\n[TEST 3] Concurrent Approvals Race Condition Simulation...");
  // Reset loan1 and create two new loans each for $7,000 against a $10,000 pool
  await LoanRequest.findByIdAndUpdate(loan1._id, { status: "pending" });
  await LoanRequest.findByIdAndUpdate(loan2._id, { requestedAmount: 7000, status: "pending" });
  await LoanRequest.findByIdAndUpdate(loan1._id, { requestedAmount: 7000 });

  // Launch both approvals simultaneously without awaiting between calls
  const p1 = runRoute(router, "post", `/admin/${loan1._id}/decision`, {
    user: admin,
    params: { id: loan1._id.toString() },
    body: { action: "approve" }
  }, mockEnv).then((r) => ({ success: true, status: r.statusCode })).catch((e) => ({ success: false, status: e.status }));

  const p2 = runRoute(router, "post", `/admin/${loan2._id}/decision`, {
    user: admin,
    params: { id: loan2._id.toString() },
    body: { action: "approve" }
  }, mockEnv).then((r) => ({ success: true, status: r.statusCode })).catch((e) => ({ success: false, status: e.status }));

  const results = await Promise.all([p1, p2]);
  const successes = results.filter((r) => r.success && r.status === 200).length;
  const conflicts = results.filter((r) => !r.success && r.status === 409).length;
  assert.strictEqual(successes, 1, `Exactly 1 approval should succeed, got ${successes}`);
  assert.strictEqual(conflicts, 1, `Exactly 1 approval should throw 409 conflict, got ${conflicts}`);
  console.log("-> Passed: Concurrent approvals serialized reliably under transaction & mutex; only 1 succeeded.");

  await mongoose.disconnect();
  console.log("\n=== ALL LOAN APPROVAL POOL TESTS PASSED 100% ===");
}

if (require.main === module) {
  runAllTests().catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
}

module.exports = { runAllTests };
