import { ISong } from "../model/types";
import { API_URL } from "./helpers.service";

const songCache: Map<string, ISong> = new Map();

export function addSongToCache(song: ISong) {
  songCache.set(song.id, song);
}

export function addSongsToCache(songs: ISong[]) {
  songs.forEach((song: ISong) => {
    addSongToCache(song);
  });
}

export function getSongFromCache(id: string): ISong | undefined {
  return songCache.get(id);
}

export function clearSongCache() {
  songCache.clear();
}

export async function getAllSongs(): Promise<ISong[]> {
  try {
    const response = await fetch(`${API_URL}/song`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch songs");
    }

    const data = await response.json();
    let songs: ISong[] = [];

    if (Array.isArray(data)) {
      songs = data;
    } else if (data.songs) {
      songs = data.songs;
    }

    addSongsToCache(songs);

    return songs;
  } catch (error) {
    console.error("Error fetching songs:", error);
    throw error;
  }
}

export async function getSongById(id: string): Promise<ISong> {
  const cachedSong = getSongFromCache(id);
  if (cachedSong) {
    return cachedSong;
  }

  try {
    const response = await fetch(`${API_URL}/song/${id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch song");
    }

    const data = await response.json();
    let song: ISong;

    if (data.id) {
      song = data as ISong;
    } else if (data.song) {
      song = data.song;
    } else {
      throw new Error("Invalid song data received");
    }

    addSongToCache(song);

    return song;
  } catch (error) {
    console.error(`Error fetching song ${id}:`, error);
    throw error;
  }
}

export async function searchSongs(query: string): Promise<ISong[]> {
  try {
    const response = await fetch(
      `${API_URL}/song/search?query=${encodeURIComponent(query)}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to search songs");
    }

    const data = await response.json();
    let songs: ISong[] = [];

    if (Array.isArray(data)) {
      songs = data;
    } else if (data.songs) {
      songs = data.songs;
    }

    addSongsToCache(songs);

    return songs;
  } catch (error) {
    console.error("Error searching songs:", error);
    throw error;
  }
}
