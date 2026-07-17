const assert = require("assert");
const { createUpload } = require("../src/config/upload");
const { HttpError } = require("../src/utils/httpError");

function runFilter(uploadInstance, file) {
  return new Promise((resolve, reject) => {
    // multer's fileFilter signature: (req, file, cb)
    // we extract fileFilter from uploadInstance or run through instance check
    const filter = uploadInstance.fileFilter;
    if (!filter) return reject(new Error("No fileFilter found on upload instance"));
    filter({}, file, (err, accept) => {
      if (err) return reject(err);
      resolve(accept);
    });
  });
}

async function runAllTests() {
  console.log("=== STARTING P0-05 UPLOAD SECURITY TEST SUITE ===");
  const vehicleUpload = createUpload("uploads", "vehicle-images");
  const loanUpload = createUpload("uploads", "loan-documents");

  console.log("\n[TEST 1] Safe File Types (MIME + Extension Match)...");
  assert.strictEqual(await runFilter(vehicleUpload, { originalname: "car.png", mimetype: "image/png" }), true);
  assert.strictEqual(await runFilter(vehicleUpload, { originalname: "photo.webp", mimetype: "image/webp" }), true);
  assert.strictEqual(await runFilter(loanUpload, { originalname: "doc.pdf", mimetype: "application/pdf" }), true);
  console.log("-> Passed: Valid types and MIME types accepted.");

  console.log("\n[TEST 2] MIME Type Mismatch (Valid Ext, Wrong MIME)...");
  try {
    await runFilter(vehicleUpload, { originalname: "fake.jpg", mimetype: "application/x-msdownload" });
    assert.fail("Should reject MIME mismatch");
  } catch (err) {
    assert.ok(err instanceof HttpError);
    assert.strictEqual(err.status, 400);
    console.log("-> Passed: MIME mismatch rejected cleanly.");
  }

  console.log("\n[TEST 3] Dangerous Extensions...");
  for (const ext of ["exe", "dll", "bat", "cmd", "sh", "php", "html", "svg", "js", "jar", "py"]) {
    try {
      await runFilter(loanUpload, { originalname: `malicious.${ext}`, mimetype: "image/jpeg" });
      assert.fail(`Should reject .${ext}`);
    } catch (err) {
      assert.strictEqual(err.status, 400);
    }
  }
  console.log("-> Passed: All 11 dangerous extensions blocked.");

  console.log("\n[TEST 4] Path Traversal Prevention...");
  for (const name of ["../secret.jpg", "..\\windows\\system32\\cmd.jpg", "/etc/passwd.png"]) {
    try {
      await runFilter(vehicleUpload, { originalname: name, mimetype: "image/png" });
      assert.fail(`Should reject path traversal ${name}`);
    } catch (err) {
      assert.strictEqual(err.status, 400);
      assert.strictEqual(err.message, "Path traversal detected in filename");
    }
  }
  console.log("-> Passed: Path traversal attempts blocked.");

  console.log("\n[TEST 5] Double Extensions Rejection...");
  try {
    await runFilter(vehicleUpload, { originalname: "image.jpg.exe", mimetype: "image/jpeg" });
    assert.fail("Should reject double extension");
  } catch (err) {
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.message, "Double extensions are not allowed");
    console.log("-> Passed: Double extensions (image.jpg.exe) rejected.");
  }

  console.log("\n=== ALL P0-05 UPLOAD SECURITY TESTS PASSED 100% ===");
}

if (require.main === module) {
  runAllTests().catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
}

module.exports = { runAllTests };
