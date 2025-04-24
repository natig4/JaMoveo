import { Server as HttpServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";
import config from "../config";
import { handleConnection } from "./events.controller";
import { getUserById } from "../services/users.service";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "./types";

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

export function setupSocketIO(
  httpServer: HttpServer
): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  if (io) {
    console.log("Cleaning up existing Socket.IO server");
    io.disconnectSockets(true);
    io.close();
  }

  io = new SocketIOServer<
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
      maxDisconnectionDuration: 10000,
      skipMiddlewares: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  io.use((socket, next) => {
    try {
      const userId = socket.handshake.auth.userId as string | undefined;
      if (userId) {
        console.log(`Socket auth: User ID ${userId} provided in auth payload`);
        const user = getUserById(userId);
        if (user) {
          socket.data.userId = userId;
          socket.data.user = user;
          console.log(`Socket auth: User ${userId} authenticated successfully`);
          return next();
        } else {
          console.log(`Socket auth: User ${userId} not found in database`);
        }
      }

      if (config.nodeEnv === "development") {
        if (userId) {
          console.log(
            `Socket auth [DEV]: Allowing user ${userId} in development mode`
          );
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
    console.log(`New socket connection: ${socket.id}`);
    handleConnection(io!, socket);
  });

  console.log("Socket.IO server initialized");
  return io;
}

export function getSocketServer() {
  return io;
}

export function closeSocketServer() {
  if (io) {
    console.log("Closing Socket.IO server");
    io.disconnectSockets(true);
    io.close();
    io = null;
  }
}
