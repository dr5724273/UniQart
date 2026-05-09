const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { errorHandler } = require("./middleware/errorHandler");
const { authRoutes } = require("./routes/auth");
const { vehiclesRoutes } = require("./routes/vehicles");
const { financeOffersRoutes } = require("./routes/financeOffers");
const { bookingsRoutes } = require("./routes/bookings");
const { loanRequestsRoutes } = require("./routes/loanRequests");
const { adminUsersRoutes } = require("./routes/adminUsers");

function createApp(env) {
  const app = express();

  app.use(helmet());
  if (env.HTTP_LOG !== "off") {
    app.use(
      morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
        skip: (req) => {
          const ua = String(req.headers["user-agent"] || "");
          // Reduce noise when testing via Postman
          if (ua.includes("PostmanRuntime")) return true;
          return false;
        }
      })
    );
  }

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Static uploads (local dev)
  app.use(`/${env.UPLOAD_DIR}`, express.static(path.resolve(env.UPLOAD_DIR)));

  // Root (avoid confusing 404 when opening base URL in browser/Postman)
  app.get("/", (_req, res) => {
    return res.json({
      ok: true,
      name: "UniQart API",
      health: "/api/health",
      hint: "All REST endpoints are under /api/* (example: /api/auth/login)."
    });
  });

  // Convenience: allow calling endpoints without the `/api` prefix (common Postman mistake)
  // Redirect preserves method + body via 308.
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();

    const first = req.path.split("/").filter(Boolean)[0];
    const apiAliases = new Set(["health", "auth", "vehicles", "finance-offers", "bookings", "loan-requests", "admin"]);
    if (!first || !apiAliases.has(first)) return next();

    return res.redirect(308, `/api${req.originalUrl}`);
  });

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes(env));
  app.use("/api/vehicles", vehiclesRoutes(env));
  app.use("/api/finance-offers", financeOffersRoutes(env));
  app.use("/api/bookings", bookingsRoutes(env));
  app.use("/api/loan-requests", loanRequestsRoutes(env));
  app.use("/api/admin", adminUsersRoutes(env));

  // 404 (keep before errorHandler)
  app.use((req, res) => {
    return res.status(404).json({
      error: "Not Found",
      method: req.method,
      path: req.originalUrl,
      hint: "API routes are under /api/* (example: /api/auth/login)."
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
