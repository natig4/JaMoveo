export interface Song {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string;
  data: SongData[];
}

interface SongData {
  lyrics: string;
  chords?: string;
}

export interface UserCredentials {
  username: string;
  password: string;
  passwordHash: string;
}

export interface User
  extends Omit<UserCredentials, "password" | "passwordHash"> {
  id: string;
  role: UserRole;
}

export const UserRole = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
