const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { randomUUID } = require("crypto");
const { HttpError } = require("../utils/httpError");

const SAFE_CONFIGS = {
  "vehicle-images": {
    extensions: new Set([".jpg", ".jpeg", ".png", ".webp"]),
    mimes: new Set(["image/jpeg", "image/png", "image/webp"])
  },
  "loan-documents": {
    extensions: new Set([".pdf", ".jpg", ".jpeg", ".png"]),
    mimes: new Set(["application/pdf", "image/jpeg", "image/png"])
  }
};

const DANGEROUS_EXTENSIONS = new Set([
  "exe", "dll", "bat", "cmd", "sh", "php", "html", "svg", "js", "jar", "py"
]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function createUpload(uploadRoot, subdir) {
  const targetDir = path.join(uploadRoot, subdir);
  ensureDir(targetDir);

  const config = SAFE_CONFIGS[subdir] || {
    extensions: new Set([".jpg", ".jpeg", ".png"]),
    mimes: new Set(["image/jpeg", "image/png"])
  };

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, targetDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${Date.now()}-${randomUUID()}${ext}`);
    }
  });

  const fileFilter = (_req, file, cb) => {
    const originalname = file.originalname || "";

    // 4. Prevent path traversal
    if (originalname.includes("..") || originalname.includes("/") || originalname.includes("\\") || path.basename(originalname) !== originalname) {
      return cb(new HttpError(400, "Path traversal detected in filename"), false);
    }

    const parts = originalname.split(".");
    // 5. Reject double extensions like image.jpg.exe
    if (parts.length > 2) {
      return cb(new HttpError(400, "Double extensions are not allowed"), false);
    }

    // 3. Reject dangerous files
    for (let i = 1; i < parts.length; i++) {
      if (DANGEROUS_EXTENSIONS.has(parts[i].toLowerCase())) {
        return cb(new HttpError(400, "Dangerous file type not allowed"), false);
      }
    }

    // 1 & 2. Validate BOTH MIME Type and File Extension
    const ext = path.extname(originalname).toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();

    if (!config.extensions.has(ext) || !config.mimes.has(mime)) {
      return cb(new HttpError(400, `Invalid file type for ${subdir}`), false);
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
  });
}

module.exports = { createUpload };

