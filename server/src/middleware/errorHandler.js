const { HttpError } = require("../utils/httpError");
const { ZodError } = require("zod");
const multer = require("multer");

function errorHandler(err, _req, res, _next) {
  let status = 500;
  let message = "Internal server error";

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
  } else if (err instanceof ZodError || err.name === "ZodError") {
    status = 400;
    message = err.errors?.map((e) => `${e.path.join(".") ? e.path.join(".") + ": " : ""}${e.message}`).join(", ") || "Validation failed";
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(", ") || "Validation error";
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path || "ID"}: ${err.value || "format"}`;
  } else if (err.code === 11000 || err.code === 11001 || ((err.name === "MongoServerError" || err.name === "BulkWriteError") && (err.code === 11000 || err.code === 11001))) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `Duplicate value for ${field}` : "Duplicate resource already exists";
  } else if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Token expired";
  } else if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
    status = 401;
    message = "Invalid token";
  } else if (err instanceof multer.MulterError || err.name === "MulterError") {
    status = 400;
    message = err.message || "File upload error";
  } else if (err instanceof SyntaxError && "body" in err && err.status === 400) {
    status = 400;
    message = "Malformed JSON in request body";
  } else if (err instanceof Error) {
    status = err.status || 500;
    message = status >= 500 && process.env.NODE_ENV === "production" ? "Internal server error" : err.message || "Internal server error";
  }

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const response = { error: message };
  if (process.env.NODE_ENV !== "production" && status >= 500 && err && err.stack) {
    response.stack = err.stack;
  }

  return res.status(status).json(response);
}

module.exports = { errorHandler };

