const { HttpError } = require("../utils/httpError");

function requireRole(...roles) {
  return function roleMiddleware(req, _res, next) {
    if (!req.user) return next(new HttpError(401, "Not authenticated"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Forbidden"));
    return next();
  };
}

module.exports = { requireRole };

