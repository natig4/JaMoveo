import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import config from "../config";
import { handleConnection } from "./events.controller";
import { getUserById } from "../services/users.service";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "./types";

export function setupSocketIO(
  httpServer: HttpServer
): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
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
      maxDisconnectionDuration: 5000,
      skipMiddlewares: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  io.use((socket, next) => {
    try {
      const userId = socket.handshake.auth.userId as string | undefined;
      if (userId) {
        const user = getUserById(userId);
        if (user) {
          socket.data.userId = userId;
          socket.data.user = user;

          return next();
        }
      }

      if (config.nodeEnv === "development") {
        if (userId) {
          socket.data.userId = userId;
          const user = getUserById(userId);
          if (user) {
            socket.data.user = user;
          }
          return next();
        }
      }

      return next(new Error("Authentication required"));
    } catch (err) {
      console.error("Socket authentication error:", err);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    handleConnection(io, socket);
  });

  return io;
}
