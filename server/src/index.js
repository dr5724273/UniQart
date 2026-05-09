require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { loadEnv } = require("./config/env");
const { connectDb } = require("./config/db");
const { createApp } = require("./app");

async function main() {
  const env = loadEnv();
  fs.mkdirSync(path.resolve(env.UPLOAD_DIR), { recursive: true });

  await connectDb(env.MONGODB_URI);

  const app = createApp(env);
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`UniQart API listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
