import { IUser } from "../models/types";

export interface ServerToClientEvents {
  auth_success: (data: {
    connected: boolean;
    message: string;
    activeSongId?: string;
  }) => void;
  song_selected: (data: { songId: string }) => void;
  song_quit: () => void;
  connection_status: (connected: boolean) => void;
}

export interface ClientToServerEvents {
  authenticate: (data: { userId: string }) => void;
  select_song: (data: { userId: string; songId: string }) => void;
  quit_song: (data: { userId: string }) => void;
  get_active_song: (callback: (songId: string | null) => void) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  user?: IUser;
}

export interface AuthenticateData {
  userId: string;
}

export interface SelectSongData {
  userId: string;
  songId: string;
}

export interface QuitSongData {
  userId: string;
}
