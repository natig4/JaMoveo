const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const serverRoot = path.join(__dirname, "..");
const projectRoot = path.join(serverRoot, "..");
const clientRoot = path.join(projectRoot, "client");
const clientDist = path.join(clientRoot, "dist");
const clientIndexHtml = path.join(clientDist, "index.html");

console.log("Checking client build status...");

if (!fs.existsSync(clientDist) || !fs.existsSync(clientIndexHtml)) {
  console.log("Client build not found. Building now...");

  try {
    console.log("Running: cd ../client && npm run build");
    execSync("npm run build", { cwd: clientRoot, stdio: "inherit" });
    console.log("Client built successfully!");
  } catch (error) {
    console.error("Failed to build client:", error.message);
    console.log("\nAlternative: You can run the client dev server separately:");
    console.log("  Run: cd ../client && npm run dev");
    console.log("  The backend will redirect to the Vite dev server.");
    process.exit(1);
  }
} else {
  console.log("Client build found at:", clientDist);
  console.log("The server will serve these static files.");
}
