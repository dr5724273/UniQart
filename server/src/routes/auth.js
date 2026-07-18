const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { asyncHandler } = require("../middleware/asyncHandler");
const { HttpError } = require("../utils/httpError");
const { User } = require("../models/User");
const { auth, getTokenFromRequest } = require("../middleware/auth");

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status
  };
}

function authRoutes(env) {
  const router = require("express").Router();

  const registerSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    phone: z.string().min(7).max(20),
    password: z.string().min(8).max(200),
    role: z.enum(["buyer", "lister"])
  });

  router.post(
    "/register",
    asyncHandler(async (req, res) => {
      const body = registerSchema.safeParse(req.body);
      if (!body.success) throw new HttpError(400, "Invalid input");

      const existing = await User.findOne({ email: body.data.email });
      if (existing) throw new HttpError(409, "Email already in use");

      const passwordHash = await bcrypt.hash(body.data.password, 12);
      const user = await User.create({
        name: body.data.name,
        email: body.data.email,
        phone: body.data.phone,
        password: passwordHash,
        role: body.data.role
      });

      return res.status(201).json({ user: toPublicUser(user) });
    })
  );

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  });

  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const body = loginSchema.safeParse(req.body);
      if (!body.success) throw new HttpError(400, "Invalid input");

      const user = await User.findOne({ email: body.data.email });
      if (!user) throw new HttpError(401, "Invalid credentials");
      if (user.status === "suspended") throw new HttpError(403, "Account suspended");

      const ok = await bcrypt.compare(body.data.password, user.password);
      if (!ok) throw new HttpError(401, "Invalid credentials");

      const token = jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN
      });

      const cookieOptions = {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax"
      };

      res.cookie("token", token, cookieOptions);

      return res.json({ user: toPublicUser(user), token });
    })
  );

  router.post(
    "/logout",
    asyncHandler(async (_req, res) => {
      const cookieOptions = {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax"
      };

      res.clearCookie("token", cookieOptions);
      return res.json({ ok: true });
    })
  );

  router.get(
    "/me",
    auth(env),
    asyncHandler(async (req, res) => {
      return res.json({ user: req.user, token: getTokenFromRequest(req) });
    })
  );

  router.post(
    "/fcm-token",
    auth(env),
    asyncHandler(async (req, res) => {
      const body = z.object({ token: z.string().min(1) }).safeParse(req.body);
      if (!body.success) throw new HttpError(400, "Invalid FCM token");

      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { fcmTokens: body.data.token }
      });
      return res.json({ ok: true });
    })
  );

  router.delete(
    "/fcm-token",
    auth(env),
    asyncHandler(async (req, res) => {
      const body = z.object({ token: z.string().min(1) }).safeParse(req.body);
      if (body.success) {
        await User.findByIdAndUpdate(req.user._id, {
          $pull: { fcmTokens: body.data.token }
        });
      }
      return res.json({ ok: true });
    })
  );

  return router;
}

module.exports = { authRoutes };

