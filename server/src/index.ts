import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import http from "http";
import https from "https";
import { readFileSync, existsSync } from "fs";
import path from "path";
import app from "./app";
import config from "./config/index";
import { loadSongs } from "./services/songs.service";
import { loadUsers } from "./services/users.service";
import { loadGroups } from "./services/groups.service";
import { setupSocketIO } from "./socket";

const PORT = config.port;

// TODO: in case of moving from json files to proper DB remove this
async function initializeData() {
  try {
    await Promise.all([loadSongs(), loadUsers(), loadGroups()]);
    console.log("Data initialization complete");
  } catch (error) {
    console.error("Failed to initialize data:", error);
    process.exit(1);
  }
}

async function startServer() {
  await initializeData();

  let server;

  if (config.nodeEnv === "development" && config.useHttps) {
    const keyPath = path.join(__dirname, "..", "key.pem");
    const certPath = path.join(__dirname, "..", "cert.pem");

    if (existsSync(keyPath) && existsSync(certPath)) {
      try {
        const key = readFileSync(keyPath);
        const cert = readFileSync(certPath);

        // server = http.createServer(app);
        server = https.createServer({ key, cert }, app);
        console.log("Starting server with HTTPS");
      } catch (error) {
        console.error(
          "Error loading certificates, falling back to HTTP:",
          error
        );
        server = http.createServer(app);
      }
    } else {
      console.log("SSL certificates not found, using HTTP server");
      server = http.createServer(app);
    }
  } else {
    // In production, use plain HTTP (provider handles HTTPS)
    server = http.createServer(app);
  }

  setupSocketIO(server);

  server.listen(PORT, () => {
    const protocol = server instanceof https.Server ? "HTTPS" : "HTTP";
    console.log(
      `Server running in ${config.nodeEnv} mode on ${protocol} port ${PORT}`
    );
    console.log(`Visit: ${protocol.toLowerCase()}://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
