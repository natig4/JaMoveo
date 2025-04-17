import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import http from "http";
import app from "./app";
import config from "./config/index";
import { loadSongs } from "./services/songs.service";
import { loadUsers } from "./services/users.service";

const PORT = config.port;

// TODO: in case of moving from json files to proper DB remove this
async function initializeData() {
  try {
    await Promise.all([loadSongs(), loadUsers()]);
    console.log("Data initialization complete");
  } catch (error) {
    console.error("Failed to initialize data:", error);
    process.exit(1);
  }
}

async function startServer() {
  await initializeData();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
