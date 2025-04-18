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

function parseCookie(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieString) return cookies;

  cookieString.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts[0].trim();
    const value = parts.slice(1).join("=").trim();
    cookies[name] = value;
  });

  return cookies;
}

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
    const address = socket.handshake.address;
    console.log(`Socket connection attempt from ${address}`);

    try {
      const userId = socket.handshake.auth.userId as string | undefined;
      if (userId) {
        const user = getUserById(userId);
        if (user) {
          socket.data.userId = userId;
          socket.data.user = user;
          console.log(`Socket authenticated with direct userId: ${userId}`);
          return next();
        }
      }

      if (config.nodeEnv === "development") {
        if (userId) {
          console.log(
            `Development mode: Allowing connection for userId: ${userId}`
          );
          socket.data.userId = userId;
          const user = getUserById(userId);
          if (user) {
            socket.data.user = user;
          }
          return next();
        }
      }

      console.log("No valid authentication method");
      return next(new Error("Authentication required"));
    } catch (err) {
      console.error("Socket authentication error:", err);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const address = socket.handshake.address;
    const userId = socket.data.userId;
    console.log(
      `New socket connection from ${address}${
        userId ? ` (user: ${userId})` : ""
      }`
    );

    handleConnection(io, socket);
  });

  return io;
}
