const { HttpError } = require("../utils/httpError");

function errorHandler(err, _req, res, _next) {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof HttpError ? err.message : "Internal server error";

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return res.status(status).json({ error: message });
}

module.exports = { errorHandler };

