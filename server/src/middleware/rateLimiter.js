const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ip = req.ip || req.headers["x-forwarded-for"] || (req.socket && req.socket.remoteAddress) || "127.0.0.1";
      return ipKeyGenerator(ip);
    },
    message: { error: message || "Too many requests, please try again later." },
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode).json(options.message);
    }
  });

const authLimiter = createLimiter(15 * 60 * 1000, 10, "Too many authentication attempts, please try again after 15 minutes.");
const uploadLimiter = createLimiter(60 * 60 * 1000, 20, "Too many file upload requests, please try again after an hour.");
const bookingLimiter = createLimiter(60 * 60 * 1000, 60, "Too many booking requests, please try again after an hour.");
const financeLimiter = createLimiter(60 * 60 * 1000, 60, "Too many finance requests, please try again after an hour.");
const generalLimiter = createLimiter(15 * 60 * 1000, 300, "Too many requests from this IP, please try again after 15 minutes.");

module.exports = {
  createLimiter,
  authLimiter,
  uploadLimiter,
  bookingLimiter,
  financeLimiter,
  generalLimiter
};
