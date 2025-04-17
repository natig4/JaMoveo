export interface IUser {
  id: string;
  username: string;
  role: UserRole;
  instrument?: string;
  imageUrl?: string;
}

export interface IUserCredentials {
  username: string;
  password: string;
}

export interface ISongItem {
  lyrics: string;
  chords?: string;
}

export type SongLine = ISongItem[];

export interface ISong {
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
