import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import config from "../config";
import { handleConnection } from "./events.controller";

export function setupSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    cookie: {
      name: "jamoveo-socket",
      httpOnly: true,
      secure: config.nodeEnv === "production",
    },

    connectionStateRecovery: {
      maxDisconnectionDuration: 2000,
      skipMiddlewares: true,
    },
  });

  io.use((socket, next) => {
    const address = socket.handshake.address;
    console.log(`New socket connection attempt from ${address}`);

    next();
  });

  io.on("connection", (socket) => {
    handleConnection(io, socket);
  });

  return io;
}
