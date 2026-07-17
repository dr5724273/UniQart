const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { randomUUID } = require("crypto");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function createUpload(uploadRoot, subdir) {
  const targetDir = path.join(uploadRoot, subdir);
  ensureDir(targetDir);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, targetDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${Date.now()}-${randomUUID()}${ext}`);
    }
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
  });
}

module.exports = { createUpload };

