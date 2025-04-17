export interface ISong {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string;
  data: SongLine[];
}

export type SongLine = ISongItem[];

export interface ISongItem {
  lyrics: string;
  chords?: string;
}

export interface IUserCredentials {
  username: string;
  password?: string;
}

export interface IUser {
  id: string;
  username: string;
  instrument?: string;
  email?: string;
  password?: string;
  googleId?: string;
  displayName?: string;
  role: UserRole;
}

export const UserRole = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface IGoogleUserProfile {
  googleId: string;
  username: string;
  email?: string;
  displayName?: string;
  role: UserRole;
}
