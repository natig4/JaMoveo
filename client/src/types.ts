export interface User {
  id: number;
  username: string;
  role: string;
}

export interface SongItem {
  lyrics: string;
  chords?: string;
}

export type SongLine = SongItem[];

export interface Song {
  id: number;
  title: string;
  artist: string;
  imageUrl?: string;
  data: SongLine[];
}
