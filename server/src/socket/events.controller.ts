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

// Better to use redis here
const userSockets = new Map<string, string[]>();
const userGroups = new Map<string, string>();
const groupRooms = new Map<string, Set<string>>();
const activeGroupSongs = new Map<string, string>();

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
      if (!userSockets.has(userId)) {
        userSockets.set(userId, []);
      }
      userSockets.get(userId)?.push(socket.id);

      let activeSongId: string | undefined = undefined;

      if (user.groupId) {
        const group = getGroupById(user.groupId);
        if (group) {
          joinGroupRoom(socket, user, group.id);

          activeSongId = activeGroupSongs.get(group.id);
        }
      }

      socket.emit("auth_success", {
        connected: true,
        message: "Authentication successful",
        activeSongId,
      });
    }
  }

  setupSocketEventListeners(io, socket);

  socket.emit("connection_status", true);
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
      handleSelectSong(io, data);
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
      if (socket.data.userId) {
        const user = getUserById(socket.data.userId);
        if (user && user.groupId) {
          const activeSongId = activeGroupSongs.get(user.groupId) || null;
          callback(activeSongId);
          return;
        }
      }
      callback(null);
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

  if (!userSockets.has(userId)) {
    userSockets.set(userId, []);
  }
  userSockets.get(userId)?.push(socket.id);

  let activeSongId: string | undefined = undefined;

  if (user.groupId) {
    const group = getGroupById(user.groupId);

    if (group) {
      joinGroupRoom(socket, user, group.id);

      activeSongId = activeGroupSongs.get(group.id);
    }
  }

  socket.data.userId = userId;
  socket.data.user = user;

  socket.emit("auth_success", {
    connected: true,
    message: "Authentication successful",
    activeSongId,
  });
}

async function handleSelectSong(
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  { userId, songId }: SelectSongData
): Promise<void> {
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

  if (!user || !user.groupId) return;

  const group = getGroupById(user.groupId);
  if (!group || group.adminId !== user.id) return;

  activeGroupSongs.delete(user.groupId);

  const roomId = `group:${user.groupId}`;

  io.to(roomId).emit("song_quit");
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

  if (!userId) return;

  const userSocketIds = userSockets.get(userId) || [];
  const updatedSocketIds = userSocketIds.filter((id) => id !== socket.id);

  if (updatedSocketIds.length > 0) {
    userSockets.set(userId, updatedSocketIds);
  } else {
    userSockets.delete(userId);
  }

  const groupId = userGroups.get(userId);

  if (groupId && groupRooms.has(groupId)) {
    groupRooms.get(groupId)?.delete(socket.id);

    if (groupRooms.get(groupId)?.size === 0) {
      groupRooms.delete(groupId);
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
  socket.join(roomId);

  userGroups.set(user.id, groupId);

  if (!groupRooms.has(groupId)) {
    groupRooms.set(groupId, new Set());
  }
  groupRooms.get(groupId)?.add(socket.id);
}
