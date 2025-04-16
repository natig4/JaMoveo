export interface Song {
  id: number;
  title: string;
  artist: string;
  imageUrl?: string;
  data: SongLine[];
}

export type SongLine = SongItem[];

export interface SongItem {
  lyrics: string;
  chords?: string;
}

export interface User {
  id: number;
  role: UserRole;
  username: string;
  password: string;
  instrument?: string;
}

export const UserRole = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
