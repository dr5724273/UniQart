const jwt = require("jsonwebtoken");
const { HttpError } = require("../utils/httpError");
const { User } = require("../models/User");

function getTokenFromRequest(req) {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function auth(env) {
  return async function authMiddleware(req, _res, next) {
    const token = getTokenFromRequest(req);
    if (!token) return next(new HttpError(401, "Not authenticated"));

    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(payload.sub).select("-password").lean();
      if (!user) return next(new HttpError(401, "Not authenticated"));
      if (user.status === "suspended") return next(new HttpError(403, "Account suspended"));
      req.user = user;
      return next();
    } catch (_err) {
      return next(new HttpError(401, "Invalid token"));
    }
  };
}

module.exports = { auth, getTokenFromRequest };

