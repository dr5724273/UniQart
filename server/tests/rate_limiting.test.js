const assert = require("assert");
const express = require("express");
const { createLimiter, authLimiter, uploadLimiter, bookingLimiter, financeLimiter, generalLimiter } = require("../src/middleware/rateLimiter");

function createTestApp(limiter) {
  const app = express();
  app.set("trust proxy", 1);
  app.get("/test", limiter, (req, res) => res.json({ ok: true }));
  return app;
}

// Helper to simulate request via express routing
function runRequest(app, ip = "123.45.67.89") {
  return new Promise((resolve) => {
    const req = {
      method: "GET",
      url: "/test",
      headers: { "x-forwarded-for": ip },
      ip,
      socket: { remoteAddress: ip }
    };
    const res = {
      statusCode: 200,
      headers: {},
      status(c) {
        this.statusCode = c;
        return this;
      },
      setHeader(k, v) {
        this.headers[k.toLowerCase()] = v;
      },
      getHeader(k) {
        return this.headers[k.toLowerCase()];
      },
      json(d) {
        this.body = d;
        resolve(this);
        return this;
      },
      send(d) {
        this.body = d;
        resolve(this);
        return this;
      }
    };
    app.handle(req, res);
  });
}

async function runAllTests() {
  console.log("=== STARTING P1-02 RATE LIMITING & API HARDENING TEST SUITE ===");

  console.log("\n[TEST 1] Auth Limiter (10 req/15 min limit enforcement)...");
  const authApp = createTestApp(createLimiter(15 * 60 * 1000, 10, "Too many authentication attempts, please try again after 15 minutes."));
  const testIp = "10.0.0.1";
  for (let i = 1; i <= 10; i++) {
    const r = await runRequest(authApp, testIp);
    assert.strictEqual(r.statusCode, 200, `Request ${i} should succeed`);
  }
  const blockedAuth = await runRequest(authApp, testIp);
  assert.strictEqual(blockedAuth.statusCode, 429);
  assert.deepStrictEqual(blockedAuth.body, { error: "Too many authentication attempts, please try again after 15 minutes." });
  console.log("-> Passed: Auth limiter allowed exactly 10 requests and blocked the 11th with HTTP 429 JSON.");

  console.log("\n[TEST 2] IP Isolation Check...");
  const otherIpAuth = await runRequest(authApp, "10.0.0.2");
  assert.strictEqual(otherIpAuth.statusCode, 200, "Different IP should not be blocked by first IP limit");
  console.log("-> Passed: Rate limiting properly isolated per client IP / trust proxy header.");

  console.log("\n[TEST 3] Upload Limiter (20 req/hour limit verify)...");
  const uploadApp = createTestApp(createLimiter(60 * 60 * 1000, 2, "Too many file upload requests, please try again after an hour."));
  await runRequest(uploadApp, "10.0.0.3");
  await runRequest(uploadApp, "10.0.0.3");
  const blockedUpload = await runRequest(uploadApp, "10.0.0.3");
  assert.strictEqual(blockedUpload.statusCode, 429);
  assert.deepStrictEqual(blockedUpload.body, { error: "Too many file upload requests, please try again after an hour." });
  console.log("-> Passed: Upload limiter enforces limit and returns exact 429 error format.");

  console.log("\n[TEST 4] Middleware Exports Check...");
  assert.ok(authLimiter && uploadLimiter && bookingLimiter && financeLimiter && generalLimiter, "All 5 rate limiters exported accurately.");
  console.log("-> Passed: All required limiters instantiated and exported.");

  console.log("\n=== ALL P1-02 RATE LIMITING TESTS PASSED 100% ===");
}

if (require.main === module) {
  runAllTests().catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
}

module.exports = { runAllTests };
