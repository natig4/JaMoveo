import { Server, Socket } from "socket.io";
import { getUserById } from "../services/users.service";
import { getSongById } from "../services/songs.service";
import { getGroupById } from "../services/groups.service";
import { IUser } from "../models/types";

interface AuthenticateData {
  userId: string;
}

interface SelectSongData {
  userId: string;
  songId: string;
}

const userSockets = new Map<string, string[]>();

const userGroups = new Map<string, string>();

const groupRooms = new Map<string, Set<string>>();

export function handleConnection(io: Server, socket: Socket): void {
  console.log("New socket connection:", socket.id);

  socket.on("authenticate", async (data: AuthenticateData) => {
    try {
      handleAuthenticate(io, socket, data);
    } catch (error) {
      console.error("Error handling authenticate event:", error);
      socket.disconnect();
    }
  });

  socket.on("select_song", async (data: SelectSongData) => {
    try {
      handleSelectSong(io, data);
    } catch (error) {
      console.error("Error handling select_song event:", error);
    }
  });

  socket.on("disconnect", () => {
    handleDisconnect(socket);
  });
}

function handleAuthenticate(
  io: Server,
  socket: Socket,
  { userId }: AuthenticateData
): void {
  if (!userId) {
    socket.disconnect();
    return;
  }

  const user = getUserById(userId);

  if (!user) {
    console.log(`Authentication failed: User ${userId} not found`);
    socket.disconnect();
    return;
  }

  if (!userSockets.has(userId)) {
    userSockets.set(userId, []);
  }
  userSockets.get(userId)?.push(socket.id);

  console.log(
    `User ${userId} (${user.username}) authenticated with socket ${socket.id}`
  );

  if (user.groupId) {
    const group = getGroupById(user.groupId);

    if (group) {
      joinGroupRoom(socket, user, group.id);
    }
  }

  (socket as any).userId = userId;

  socket.emit("auth_success", {
    connected: true,
    message: "Authentication successful",
  });
}

async function handleSelectSong(
  io: Server,
  { userId, songId }: SelectSongData
): Promise<void> {
  const user = getUserById(userId);

  if (!user || !user.groupId) {
    console.log("Song selection failed: User not found or not in a group");
    return;
  }

  const group = getGroupById(user.groupId);

  if (!group || group.adminId !== user.id) {
    console.log(
      `Song selection failed: User ${userId} is not the admin of their group`
    );
    return;
  }

  const song = getSongById(songId);

  if (!song) {
    console.log(`Song selection failed: Song ${songId} not found`);
    return;
  }

  const roomId = `group:${user.groupId}`;
  console.log(`Broadcasting song ${songId} (${song.title}) to room ${roomId}`);

  io.to(roomId).emit("song_selected", { songId });
}

function handleDisconnect(socket: Socket): void {
  const userId = (socket as any).userId;
  console.log(
    `Socket ${socket.id} disconnected${userId ? ` (user: ${userId})` : ""}`
  );

  if (!userId) return;

  // Remove socket from user's connections
  const userSocketIds = userSockets.get(userId) || [];
  const updatedSocketIds = userSocketIds.filter((id) => id !== socket.id);

  if (updatedSocketIds.length > 0) {
    userSockets.set(userId, updatedSocketIds);
  } else {
    userSockets.delete(userId);
  }

  // Get group ID for the user
  const groupId = userGroups.get(userId);

  // Remove socket from group room
  if (groupId && groupRooms.has(groupId)) {
    groupRooms.get(groupId)?.delete(socket.id);

    if (groupRooms.get(groupId)?.size === 0) {
      groupRooms.delete(groupId);
    }
  }
}

// Join a group room
function joinGroupRoom(socket: Socket, user: IUser, groupId: string): void {
  const roomId = `group:${groupId}`;
  socket.join(roomId);

  // Store user to group mapping
  userGroups.set(user.id, groupId);

  // Store socket in group room
  if (!groupRooms.has(groupId)) {
    groupRooms.set(groupId, new Set());
  }
  groupRooms.get(groupId)?.add(socket.id);

  console.log(`User ${user.id} (${user.username}) joined room ${roomId}`);
}
