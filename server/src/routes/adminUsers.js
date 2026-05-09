const { z } = require("zod");
const { asyncHandler } = require("../middleware/asyncHandler");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { User } = require("../models/User");

function adminUsersRoutes(env) {
  const router = require("express").Router();

  router.use(auth(env), requireRole("admin"));

  router.get(
    "/users",
    asyncHandler(async (_req, res) => {
      const items = await User.find({}).select("-password").sort({ createdAt: -1 }).lean();
      return res.json({ items });
    })
  );

  router.post(
    "/users/:id/suspend",
    asyncHandler(async (req, res) => {
      const params = z.object({ id: z.string().min(1) }).safeParse(req.params);
      const body = z.object({ suspended: z.boolean() }).safeParse(req.body);
      if (!params.success || !body.success) throw new HttpError(400, "Invalid input");

      const user = await User.findById(params.data.id);
      if (!user) throw new HttpError(404, "Not found");
      if (user.role === "admin") throw new HttpError(400, "Cannot suspend admin");

      user.status = body.data.suspended ? "suspended" : "active";
      await user.save();
      return res.json({ item: { id: user._id.toString(), status: user.status } });
    })
  );

  router.delete(
    "/users/:id",
    asyncHandler(async (req, res) => {
      const params = z.object({ id: z.string().min(1) }).safeParse(req.params);
      if (!params.success) throw new HttpError(400, "Invalid input");

      const user = await User.findById(params.data.id);
      if (!user) throw new HttpError(404, "Not found");
      if (user.role === "admin") throw new HttpError(400, "Cannot delete admin");

      await User.deleteOne({ _id: user._id });
      return res.json({ ok: true });
    })
  );

  return router;
}

module.exports = { adminUsersRoutes };
