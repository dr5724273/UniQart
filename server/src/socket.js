const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { User } = require("./models/User");

let ioInstance = null;

function initSocket(httpServer, env) {
  const corsOrigins = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((s) => s.trim()) : [];
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins.length ? corsOrigins : "*",
      credentials: true
    }
  });

  ioInstance = io;

  // Middleware for initial handshake authentication
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(";").reduce((acc, c) => {
          const parts = c.trim().split("=");
          const key = parts[0];
          const val = parts.slice(1).join("=");
          if (key) acc[key] = decodeURIComponent(val);
          return acc;
        }, {});
        token = cookies.token;
      }

      if (token && typeof token === "string" && token.startsWith("Bearer ")) {
        token = token.slice(7).trim();
      }

      if (token) {
        try {
          const payload = jwt.verify(token, env.JWT_SECRET);
          const user = await User.findById(payload.sub).select("_id role status name").lean();
          if (user && user.role === "admin" && user.status !== "suspended") {
            socket.user = user;
            socket.join("admin");
          }
        } catch (_err) {
          // invalid token during handshake
        }
      }
      return next();
    } catch (_e) {
      return next();
    }
  });

  io.on("connection", (socket) => {
    // Client can authenticate or re-authenticate after connecting (e.g. after login/token refresh)
    socket.on("authenticate", async (data) => {
      try {
        let token = data?.token;
        if (token && typeof token === "string" && token.startsWith("Bearer ")) {
          token = token.slice(7).trim();
        }
        if (!token && socket.handshake.headers?.cookie) {
          const cookies = socket.handshake.headers.cookie.split(";").reduce((acc, c) => {
            const parts = c.trim().split("=");
            const key = parts[0];
            const val = parts.slice(1).join("=");
            if (key) acc[key] = decodeURIComponent(val);
            return acc;
          }, {});
          token = cookies.token;
        }

        if (token) {
          const payload = jwt.verify(token, env.JWT_SECRET);
          const user = await User.findById(payload.sub).select("_id role status name").lean();
          if (user && user.role === "admin" && user.status !== "suspended") {
            socket.user = user;
            socket.join("admin");
            socket.emit("authenticated", { ok: true, role: "admin" });
          }
        }
      } catch (_e) {
        // ignore
      }
    });
  });

  return io;
}

function getIo() {
  return ioInstance;
}

function emitAdminNotification(notification) {
  if (ioInstance) {
    ioInstance.to("admin").emit("admin_notification", notification);
  }
}

module.exports = { initSocket, getIo, emitAdminNotification };
