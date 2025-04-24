import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import http from "http";
import https from "https";
import { readFileSync, existsSync, writeFileSync } from "fs";
import path from "path";
import app from "./app";
import config from "./config/index";
import { loadSongs } from "./services/songs.service";
import { loadUsers } from "./services/users.service";
import { loadGroups } from "./services/groups.service";
import { setupSocketIO } from "./socket";
import {
  initializeController,
  getActiveGroupSongs,
} from "./socket/events.controller";
import { saveActiveSongsSync } from "./services/activeSongs.service";

const PORT = config.port;
let isShuttingDown = false;

// Initialize all data sources
async function initializeData() {
  try {
    await Promise.all([
      loadSongs(),
      loadUsers(),
      loadGroups(),
      initializeController(),
    ]);
    console.log("Data initialization complete");
  } catch (error) {
    console.error("Failed to initialize data:", error);
    process.exit(1);
  }
}

function setupShutdownHandlers(server: http.Server | https.Server) {
  const shutdownHandler = (signal: string) => {
    console.log(
      `\n[Shutdown] ${signal} signal received, beginning graceful shutdown...`
    );

    if (isShuttingDown) return;
    isShuttingDown = true;

    try {
      console.log("[Shutdown] Retrieving active songs...");
      const activeGroupSongs = getActiveGroupSongs();
      console.log(`[Shutdown] Found ${activeGroupSongs.size} active songs`);

      console.log("[Shutdown] Saving active songs...");
      saveActiveSongsSync(activeGroupSongs);

      console.log("[Shutdown] Closing server...");
      server.close(() => {
        console.log("[Shutdown] Server closed successfully");

        setTimeout(() => {
          console.log("[Shutdown] Exiting process");
          process.exit(0);
        }, 100);
      });

      setTimeout(() => {
        console.error("[Shutdown] Forced exit after timeout");
        process.exit(1);
      }, 5000);
    } catch (error) {
      console.error("[Shutdown] Error during shutdown:", error);
      process.exit(1);
    }
  };

  ["SIGINT", "SIGTERM", "SIGUSR2"].forEach((signal) => {
    process.on(signal, () => shutdownHandler(signal));
  });

  process.on("uncaughtException", (err) => {
    console.error("\n[Uncaught Exception]", err);
    shutdownHandler("UNCAUGHT_EXCEPTION");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("\n[Unhandled Rejection]", reason);
    shutdownHandler("UNHANDLED_REJECTION");
  });
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

  // Set up regular shutdown handlers for production
  setupShutdownHandlers(server);

  // Set up specific nodemon restart handlers for development
  if (config.nodeEnv === "development") {
    // setupNodemonRestartWatcher();
  }

  // Handle manual process exit for running your own dev setup
  process.on("beforeExit", () => {
    console.log("beforeExit!!!!");

    if (!isShuttingDown) {
      console.log("\n[BeforeExit] Process is about to exit, saving state...");
      // saveBeforeNodemonRestart();
    }
  });

  // Handle exit event
  process.on("exit", () => {
    console.log("Exit!!!!");
    if (!isShuttingDown) {
      console.log("\n[Exit] Process is exiting, saving state...");
      // Note: async operations don't work in 'exit' handlers
      try {
        const activeGroupSongs = getActiveGroupSongs();
        saveActiveSongsSync(activeGroupSongs);
      } catch (e) {
        console.error("[Exit] Failed to save state:", e);
      }
    }
  });

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
