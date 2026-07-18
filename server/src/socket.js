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
  console.log("[Notification] Starting send attempt for:", {
    id: notification.id,
    title: notification.title,
    type: notification.type
  });

  try {
    if (ioInstance) {
      ioInstance.to("admin").emit("admin_notification", notification);
      const room = ioInstance.sockets.adapter.rooms.get("admin");
      console.log(`[Notification] Socket.IO emitted to 'admin' room successfully. Active sockets in room: ${room ? room.size : 0}`);
    } else {
      console.warn("[Notification] Socket.IO ioInstance not available; skipping foreground socket emit.");
    }
  } catch (socketErr) {
    console.error("[Notification] Socket.IO emit error:", socketErr.message);
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

    if (tokens.size === 0) {
      console.log("[Notification] No active FCM tokens found in MongoDB for admins.");
    } else if (!firebaseInitialized) {
      console.warn("[Notification] Firebase Admin not initialized; skipping FCM multicast.");
    } else {
      const tokenList = Array.from(tokens);
      console.log(`[Notification] Attempting FCM broadcast to ${tokenList.length} device tokens...`);
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
      console.log(`[Notification] FCM broadcast completed. Success: ${response.successCount}, Failure: ${response.failureCount}`);
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const code = resp.error?.code;
            const msg = resp.error?.message;
            console.error(`[Notification] FCM send failed for token idx ${idx} (${tokenList[idx].slice(0, 15)}...): ${code} - ${msg}`);
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
          console.log(`[Notification] Cleaned up ${failedTokens.length} stale/invalid FCM tokens from MongoDB.`);
        }
      }
    }
  } catch (e) {
    console.error("[Notification] Error during FCM broadcast:", e.message);
  }
}

module.exports = { initSocket, getIo, emitAdminNotification };
