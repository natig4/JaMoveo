import app from "./app";
import http from "http";
import config from "./config/index";

const PORT = config.port;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});
