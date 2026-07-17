const assert = require("assert");
const { ZodError } = require("zod");
const multer = require("multer");
const { errorHandler } = require("../src/middleware/errorHandler");

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

async function runErrorHandler(err, envMode = "test") {
  const origEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = envMode;
  return new Promise((resolve) => {
    const res = createMockRes((result) => {
      process.env.NODE_ENV = origEnv;
      resolve(result);
    });
    errorHandler(err, {}, res, () => {});
  });
}

async function runAllTests() {
  console.log("=== STARTING P1-01 GLOBAL ERROR HANDLER TEST SUITE ===");

  console.log("\n[TEST 1] ZodError Handling...");
  const zodErr = new ZodError([{ path: ["email"], message: "Invalid email" }]);
  const resZod = await runErrorHandler(zodErr);
  assert.strictEqual(resZod.statusCode, 400);
  assert.strictEqual(resZod.body.error, "email: Invalid email");

  console.log("\n[TEST 2] Mongoose ValidationError...");
  const valErr = new Error("Validation failed");
  valErr.name = "ValidationError";
  valErr.errors = { age: { message: "Age must be positive" } };
  const resVal = await runErrorHandler(valErr);
  assert.strictEqual(resVal.statusCode, 400);
  assert.strictEqual(resVal.body.error, "Age must be positive");

  console.log("\n[TEST 3] CastError...");
  const castErr = new Error("Cast to ObjectId failed");
  castErr.name = "CastError";
  castErr.path = "_id";
  castErr.value = "123invalid";
  const resCast = await runErrorHandler(castErr);
  assert.strictEqual(resCast.statusCode, 400);
  assert.strictEqual(resCast.body.error, "Invalid _id: 123invalid");

  console.log("\n[TEST 4] JWT Errors...");
  const expErr = new Error("jwt expired");
  expErr.name = "TokenExpiredError";
  const resExp = await runErrorHandler(expErr);
  assert.strictEqual(resExp.statusCode, 401);
  assert.strictEqual(resExp.body.error, "Token expired");

  const jwtErr = new Error("invalid token");
  jwtErr.name = "JsonWebTokenError";
  const resJwt = await runErrorHandler(jwtErr);
  assert.strictEqual(resJwt.statusCode, 401);
  assert.strictEqual(resJwt.body.error, "Invalid token");

  console.log("\n[TEST 5] Multer Errors...");
  const multerErr = new multer.MulterError("LIMIT_FILE_SIZE");
  const resMulter = await runErrorHandler(multerErr);
  assert.strictEqual(resMulter.statusCode, 400);
  assert.strictEqual(resMulter.body.error, "File too large");

  console.log("\n[TEST 6] SyntaxError (Malformed JSON body)...");
  const synErr = new SyntaxError("Unexpected token in JSON");
  synErr.status = 400;
  synErr.body = "{ malformed }";
  const resSyn = await runErrorHandler(synErr);
  assert.strictEqual(resSyn.statusCode, 400);
  assert.strictEqual(resSyn.body.error, "Malformed JSON in request body");

  console.log("\n[TEST 7] Duplicate Key Error (E11000)...");
  const dupErr = new Error("E11000 duplicate key error");
  dupErr.code = 11000;
  dupErr.keyValue = { email: "test@example.com" };
  const resDup = await runErrorHandler(dupErr);
  assert.strictEqual(resDup.statusCode, 409);
  assert.strictEqual(resDup.body.error, "Duplicate value for email");

  console.log("\n[TEST 8] Unknown 500 Error & Production Stack Hiding...");
  const unkErr = new Error("Secret internal DB crash");
  const resDev = await runErrorHandler(unkErr, "development");
  assert.strictEqual(resDev.statusCode, 500);
  assert.ok(resDev.body.stack, "Should include stack in development mode");

  const resProd = await runErrorHandler(unkErr, "production");
  assert.strictEqual(resProd.statusCode, 500);
  assert.strictEqual(resProd.body.error, "Internal server error");
  assert.strictEqual(resProd.body.stack, undefined, "Stack trace must NEVER be exposed in production");

  console.log("-> Passed: All 8 error categories verified & production stack trace securely hidden.");
  console.log("\n=== ALL P1-01 GLOBAL ERROR HANDLER TESTS PASSED 100% ===");
}

if (require.main === module) {
  runAllTests().catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
}

module.exports = { runAllTests };
