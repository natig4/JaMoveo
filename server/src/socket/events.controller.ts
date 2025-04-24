import { Server, Socket } from "socket.io";
import { getUserById } from "../services/users.service";
import { getSongById } from "../services/songs.service";
import { getGroupById } from "../services/groups.service";
import { IUser } from "../models/types";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  AuthenticateData,
  SelectSongData,
  QuitSongData,
} from "./types";
import { loadActiveSongs } from "../services/activeSongs.service";

// Maps to track socket connections and relationships
const userSockets = new Map<string, Set<string>>();
const userGroups = new Map<string, string>();
const groupRooms = new Map<string, Set<string>>();

// Map of active songs by group ID
const activeGroupSongs = new Map<string, string>();

function logDebug(...args: any[]) {
  console.log("[Socket]", ...args);
}

export async function initializeController(): Promise<void> {
  try {
    const loadedActiveSongs = await loadActiveSongs();

    loadedActiveSongs.forEach((songId, groupId) => {
      activeGroupSongs.set(groupId, songId);
    });

    console.log(
      `Initialized socket controller with ${activeGroupSongs.size} active songs`
    );
  } catch (error) {
    console.error("Error initializing socket controller:", error);
  }
}

export function getActiveGroupSongs(): Map<string, string> {
  return activeGroupSongs;
}

export function handleConnection(
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
): void {
  logDebug(`New connection: ${socket.id}`);

  if (socket.data.userId) {
    const userId = socket.data.userId;
    logDebug(`User ${userId} authenticated on connection`);

    const user = socket.data.user || getUserById(userId);

    if (user) {
      processAuthenticatedConnection(socket, user);
    } else {
      logDebug(`User ${userId} not found, disconnecting`);
      socket.disconnect();
      return;
    }
  }

  setupSocketEventListeners(io, socket);
  socket.emit("connection_status", true);
}

function processAuthenticatedConnection(
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  user: IUser
): void {
  const userId = user.id;

  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)?.add(socket.id);

  let activeSongId: string | undefined = undefined;

  if (user.groupId) {
    const group = getGroupById(user.groupId);
    if (group) {
      joinGroupRoom(socket, user, group.id);

      activeSongId = activeGroupSongs.get(group.id);
      logDebug(`Group ${group.id} has active song: ${activeSongId || "none"}`);
    }
  }

  socket.emit("auth_success", {
    connected: true,
    message: "Authentication successful",
    activeSongId,
  });
}

function setupSocketEventListeners(
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
): void {
  socket.on("authenticate", (data: AuthenticateData) => {
    try {
      handleAuthenticate(socket, data);
    } catch (error) {
      console.error("Error handling authenticate event:", error);
      socket.disconnect();
    }
  });

  socket.on("select_song", (data: SelectSongData) => {
    try {
      handleSelectSong(io, socket, data);
    } catch (error) {
      console.error("Error handling select_song event:", error);
    }
  });

  socket.on("quit_song", (data: QuitSongData) => {
    try {
      handleQuitSong(io, data);
    } catch (error) {
      console.error("Error handling quit_song event:", error);
    }
  });

  socket.on("get_active_song", (callback) => {
    try {
      handleGetActiveSong(socket, callback);
    } catch (error) {
      console.error("Error handling get_active_song event:", error);
      callback(null);
    }
  });

  socket.on("disconnect", () => {
    handleDisconnect(socket);
  });
}

function handleAuthenticate(
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  { userId }: AuthenticateData
): void {
  logDebug(`Authentication request for user ${userId}`);

  if (!userId) {
    logDebug("Authentication failed: No userId provided");
    socket.disconnect();
    return;
  }

  const user = getUserById(userId);

  if (!user) {
    logDebug(`Authentication failed: User ${userId} not found`);
    socket.disconnect();
    return;
  }

  socket.data.userId = userId;
  socket.data.user = user;

  processAuthenticatedConnection(socket, user);
}

function handleSelectSong(
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  { userId, songId }: SelectSongData
): void {
  logDebug(`Select song request: User ${userId}, Song ${songId}`);

  const user = getUserById(userId);

  if (!user || !user.groupId) {
    logDebug(`Select song failed: User ${userId} not found or has no group`);
    return;
  }

  const group = getGroupById(user.groupId);

  if (!group || group.adminId !== user.id) {
    logDebug(
      `Select song failed: User ${userId} is not admin of group ${user.groupId}`
    );
    return;
  }

  const song = getSongById(songId);

  if (!song) {
    logDebug(`Select song failed: Song ${songId} not found`);
    return;
  }

  activeGroupSongs.set(user.groupId, songId);

  const roomId = `group:${user.groupId}`;
  logDebug(`Broadcasting song ${songId} to room ${roomId}`);

  io.to(roomId).emit("song_selected", { songId });

  socket.emit("song_selected", { songId });
}

function handleQuitSong(
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  { userId }: QuitSongData
): void {
  logDebug(`Quit song request from user ${userId}`);

  const user = getUserById(userId);

  if (!user || !user.groupId) {
    logDebug(`Quit song failed: User ${userId} not found or has no group`);
    return;
  }

  const group = getGroupById(user.groupId);

  if (!group || group.adminId !== user.id) {
    logDebug(
      `Quit song failed: User ${userId} is not admin of group ${user.groupId}`
    );
    return;
  }

  activeGroupSongs.delete(user.groupId);

  const roomId = `group:${user.groupId}`;
  logDebug(`Broadcasting song quit to room ${roomId}`);

  // Broadcast song quit to the group room
  io.to(roomId).emit("song_quit");
}

function handleGetActiveSong(
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  callback: (songId: string | null) => void
): void {
  if (!socket.data.userId) {
    logDebug("Get active song failed: No user ID on socket");
    callback(null);
    return;
  }

  const user = getUserById(socket.data.userId);
  if (!user || !user.groupId) {
    logDebug(
      `Get active song failed: User ${socket.data.userId} not found or has no group`
    );
    callback(null);
    return;
  }

  const activeSongId = activeGroupSongs.get(user.groupId) || null;
  logDebug(
    `Retrieved active song for user ${user.id} in group ${user.groupId}: ${
      activeSongId || "none"
    }`
  );
  callback(activeSongId);
}

function handleDisconnect(
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
): void {
  const userId = socket.data.userId;
  logDebug(`Socket ${socket.id} disconnected, user: ${userId || "unknown"}`);

  if (!userId) return;

  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.delete(socket.id);

    if (userSocketSet.size === 0) {
      userSockets.delete(userId);
      logDebug(`User ${userId} has no more connected sockets`);
    } else {
      logDebug(
        `User ${userId} still has ${userSocketSet.size} connected sockets`
      );
    }
  }

  const groupId = userGroups.get(userId);
  if (groupId && groupRooms.has(groupId)) {
    const groupSocketSet = groupRooms.get(groupId);

    if (groupSocketSet) {
      groupSocketSet.delete(socket.id);

      if (groupSocketSet.size === 0) {
        groupRooms.delete(groupId);
        logDebug(`Group ${groupId} has no more connected sockets`);
      } else {
        logDebug(
          `Group ${groupId} still has ${groupSocketSet.size} connected sockets`
        );
      }
    }
  }
}

function joinGroupRoom(
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  user: IUser,
  groupId: string
): void {
  const roomId = `group:${groupId}`;
  logDebug(`User ${user.id} joining room ${roomId}`);

  socket.join(roomId);

  // Track user -> group mapping
  userGroups.set(user.id, groupId);

  // Track group -> sockets mapping
  if (!groupRooms.has(groupId)) {
    groupRooms.set(groupId, new Set());
  }
  groupRooms.get(groupId)?.add(socket.id);
}
