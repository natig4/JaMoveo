import { ISong } from "../model/types";
import { API_URL } from "./helpers.service";

const songs: Map<string, ISong> = new Map();

function addSongToMap(song: ISong) {
  songs.set(song.id, song);
}

export function addSongsToCache(songs: ISong[]) {
  songs.forEach((s: ISong) => {
    addSongToMap(s);
  });
}

function getSongFromCache(id: string) {
  return songs.get(id);
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

    if (Array.isArray(data)) {
      addSongsToCache(data);
      return data;
    } else if (data.songs) {
      addSongsToCache(data.songs);
      return data.songs;
    }

    return [];
  } catch (error) {
    console.error("Error fetching songs:", error);
    throw error;
  }
}

export async function getSongById(id: string): Promise<ISong> {
  const song = getSongFromCache(id);
  if (song) {
    return song;
  }
  try {
    const response = await fetch(`${API_URL}/song/${id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch song");
    }

    const data = await response.json();

    if (data.id) {
      return data as ISong;
    } else if (data.song) {
      return data.song;
    }

    throw new Error("Invalid song data received");
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

    if (Array.isArray(data)) {
      addSongsToCache(data);
      return data;
    } else if (data.songs) {
      addSongsToCache(data.songs);
      return data.songs;
    }

    return [];
  } catch (error) {
    console.error("Error searching songs:", error);
    throw error;
  }
}
