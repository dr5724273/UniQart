const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const { User } = require("./models/User");

let ioInstance = null;
let firebaseInitialized = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
    firebaseInitialized = true;
  } else {
    try {
      admin.initializeApp();
      firebaseInitialized = true;
    } catch (_) {}
  }
} catch (e) {
  console.log("Firebase admin init skipped or failed:", e.message);
}

function initSocket(httpServer, env) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, origin || true);
      },
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
    // Client can authenticate or re-authenticate after connecting
    socket.on("authenticate", async (data) => {
      try {
        let token = data?.token || socket.handshake.auth?.token || socket.handshake.headers?.authorization;
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

async function emitAdminNotification(notification) {
  if (ioInstance) {
    ioInstance.to("admin").emit("admin_notification", notification);
  }

  try {
    const admins = await User.find({ role: "admin", status: "active" }).select("fcmTokens").lean();
    const tokens = new Set();
    for (const a of admins) {
      if (Array.isArray(a.fcmTokens)) {
        for (const t of a.fcmTokens) {
          if (t && typeof t === "string" && t.trim()) tokens.add(t.trim());
        }
      }
    }

    if (tokens.size > 0 && firebaseInitialized) {
      const tokenList = Array.from(tokens);
      const message = {
        notification: {
          title: notification.title || "New Approval Request",
          body: notification.message || "You have a new approval request pending."
        },
        data: {
          id: String(notification.id || ""),
          type: String(notification.type || ""),
          url: String(notification.url || ""),
          click_action: "FLUTTER_NOTIFICATION_CLICK"
        },
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "admin_high_importance_channel",
            priority: "high",
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        tokens: tokenList
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const code = resp.error?.code;
            if (code === "messaging/invalid-registration-token" || code === "messaging/registration-token-not-registered") {
              failedTokens.push(tokenList[idx]);
            }
          }
        });
        if (failedTokens.length > 0) {
          await User.updateMany(
            { role: "admin" },
            { $pull: { fcmTokens: { $in: failedTokens } } }
          );
        }
      }
    }
  } catch (e) {
    console.error("Error sending FCM notification:", e.message);
  }
}

module.exports = { initSocket, getIo, emitAdminNotification };
