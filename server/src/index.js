require("dotenv").config();
const fs = require("fs");
const path = require("path");
const http = require("http");
const { loadEnv } = require("./config/env");
const { connectDb } = require("./config/db");
const { createApp } = require("./app");
const { initSocket } = require("./socket");

async function main() {
  const env = loadEnv();
  fs.mkdirSync(path.resolve(env.UPLOAD_DIR), { recursive: true });

  await connectDb(env.MONGODB_URI);

  const app = createApp(env);
  const httpServer = http.createServer(app);
  initSocket(httpServer, env);

  httpServer.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`UniQart API listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
