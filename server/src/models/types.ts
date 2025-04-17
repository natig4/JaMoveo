export interface Song {
  id: string;
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
  password?: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
  googleId?: string;
  displayName?: string;
  role: UserRole;
  instrument?: string;
}

export const UserRole = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface GoogleUserProfile {
  googleId: string;
  username: string;
  email?: string;
  displayName?: string;
  role: UserRole;
}
