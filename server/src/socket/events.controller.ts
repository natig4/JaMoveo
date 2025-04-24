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

const userSockets = new Map<string, Set<string>>();
const userGroups = new Map<string, string>();
const groupRooms = new Map<string, Set<string>>();

const activeGroupSongs = new Map<string, string>();

function cleanupUserGroups(io: Server, userId: string, socketId: string) {
  const currentGroupId = userGroups.get(userId);

  if (currentGroupId) {
    const roomId = `group:${currentGroupId}`;
    const socket = io.sockets.sockets.get(socketId);

    if (socket) {
      socket.leave(roomId);
    }

    const groupSocketSet = groupRooms.get(currentGroupId);
    if (groupSocketSet) {
      groupSocketSet.delete(socketId);

      if (groupSocketSet.size === 0) {
        groupRooms.delete(currentGroupId);
      }
    }

    const userSocketSet = userSockets.get(userId);
    if (!userSocketSet || userSocketSet.size === 0) {
      userGroups.delete(userId);
    }
  }
}

export async function initializeController(): Promise<void> {
  try {
    const loadedActiveSongs = await loadActiveSongs();

    loadedActiveSongs.forEach((songId, groupId) => {
      activeGroupSongs.set(groupId, songId);
    });
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
  if (socket.data.userId) {
    const userId = socket.data.userId;

    const user = socket.data.user || getUserById(userId);

    if (user) {
      processAuthenticatedConnection(io, socket, user);

      if (!user.groupId) {
        socket.disconnect();
      }
    }
  }

  setupSocketEventListeners(io, socket);
  socket.emit("connection_status", true);
}

function processAuthenticatedConnection(
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
      joinGroupRoom(io, socket, user, group.id);

      activeSongId = activeGroupSongs.get(group.id);
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
      handleAuthenticate(io, socket, data);
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
    handleDisconnect(io, socket);
  });
}

function handleAuthenticate(
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
  { userId }: AuthenticateData
): void {
  if (!userId) {
    socket.disconnect();
    return;
  }

  const user = getUserById(userId);

  if (!user) {
    socket.disconnect();
    return;
  }

  socket.data.userId = userId;
  socket.data.user = user;

  processAuthenticatedConnection(io, socket, user);
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
  const user = getUserById(userId);

  if (!user || !user.groupId) {
    return;
  }

  const group = getGroupById(user.groupId);

  if (!group || group.adminId !== user.id) {
    return;
  }

  const song = getSongById(songId);

  if (!song) {
    return;
  }

  activeGroupSongs.set(user.groupId, songId);

  const roomId = `group:${user.groupId}`;

  io.to(roomId).emit("song_selected", { songId });
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
  const user = getUserById(userId);

  if (!user || !user.groupId) {
    return;
  }

  const group = getGroupById(user.groupId);

  if (!group || group.adminId !== user.id) {
    return;
  }

  activeGroupSongs.delete(user.groupId);

  const roomId = `group:${user.groupId}`;

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
    callback(null);
    return;
  }

  const user = getUserById(socket.data.userId);
  if (!user || !user.groupId) {
    callback(null);
    return;
  }

  const activeSongId = activeGroupSongs.get(user.groupId) || null;

  callback(activeSongId);
}

function handleDisconnect(
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
  const userId = socket.data.userId;

  if (!userId) return;

  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.delete(socket.id);

    if (userSocketSet.size === 0) {
      userSockets.delete(userId);
    }
  }

  cleanupUserGroups(io, userId, socket.id);
}

function joinGroupRoom(
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
  user: IUser,
  groupId: string
): void {
  const roomId = `group:${groupId}`;
  cleanupUserGroups(io, user.id, socket.id);
  socket.join(roomId);
  userGroups.set(user.id, groupId);

  if (!groupRooms.has(groupId)) {
    groupRooms.set(groupId, new Set());
  }

  groupRooms.get(groupId)?.add(socket.id);
}
