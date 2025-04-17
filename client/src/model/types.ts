export interface User {
  id: string;
  username: string;
  role: UserRole;
  instrument?: string;
  imageUrl?: string;
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface SongItem {
  lyrics: string;
  chords?: string;
}

export type SongLine = SongItem[];

export interface Song {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string;
  data: SongLine[];
}

export const UserRole = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
