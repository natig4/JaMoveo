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

export interface UserCredentials {
  username: string;
  password: string;
}

export interface User extends Omit<UserCredentials, "password"> {
  id: number;
  role: UserRole;
}

export const UserRole = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
