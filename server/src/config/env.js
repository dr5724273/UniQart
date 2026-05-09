const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(20),
  JWT_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN: z.string().min(1),
  UPLOAD_DIR: z.string().default("uploads"),

  // HTTP request logging (morgan)
  // Values: on/off (also accepts true/false/1/0)
  HTTP_LOG: z
    .preprocess(
      (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
      z.enum(["on", "off", "true", "false", "1", "0"]).default("on")
    )
    .transform((v) => (v === "off" || v === "false" || v === "0" ? "off" : "on"))
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

module.exports = { loadEnv };
