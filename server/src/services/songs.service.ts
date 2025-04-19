import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { ISong } from "../models/types";
import { randomUUID } from "crypto";

const songs: ISong[] = [];
const songsFilePath = path.join(__dirname, "..", "..", "data", "songs.json");

const existingTitlesAndArtists: Map<string, ISong> = new Map();

export function hasAddedSong(artist: string, title: string): boolean {
  return existingTitlesAndArtists.has(
    `${title.toLowerCase()}|${artist.toLowerCase()}`
  );
}

function hasSong(song: Omit<ISong, "id">): boolean {
  return existingTitlesAndArtists.has(getSongKey(song));
}

function addSongToMap(song: ISong) {
  existingTitlesAndArtists.set(getSongKey(song), song);
}

function getSongKey(song: Omit<ISong, "id">) {
  return `${song.title.toLowerCase()}|${song.artist.toLowerCase()}`;
}

export async function loadSongs(): Promise<void> {
  return new Promise((resolve, reject) => {
    let data = "";
    const readStream = createReadStream(songsFilePath, { encoding: "utf8" });

    readStream.on("data", (chunk) => {
      data += chunk;
    });

    readStream.on("end", () => {
      try {
        const parsedSongs = JSON.parse(data);
        songs.push(...parsedSongs);
        console.log(`Loaded ${songs.length} songs from file`);
        songs.forEach((song) => {
          addSongToMap(song);
        });
        resolve();
      } catch (error) {
        console.error("Error loading songs:", error);
        reject(error);
      }
    });

    readStream.on("error", (error) => {
      console.error("Error loading songs:", error);
      reject(error);
    });
  });
}

export function getAllSongs(): ISong[] {
  return [...songs].sort(() => Math.random() - 0.5).slice(0, 10);
}

export function getSongById(id: string): ISong | undefined {
  return songs.find((song) => song.id === id);
}

export async function addSong(song: Omit<ISong, "id">): Promise<ISong> {
  if (hasSong(song)) {
    return existingTitlesAndArtists.get(getSongKey(song))!;
  }
  const newSong: ISong = {
    ...song,
    id: randomUUID(),
  };

  songs.push(newSong);
  await saveSongs();
  return newSong;
}

async function saveSongs(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const data = JSON.stringify(songs, null, 2);
      const writeStream = createWriteStream(songsFilePath, {
        encoding: "utf8",
      });

      writeStream.write(data, (err) => {
        if (err) {
          console.error("Error saving songs:", err);
          reject(new Error("Failed to save songs data"));
          return;
        }
        writeStream.end();
      });

      writeStream.on("finish", () => {
        console.log("Songs saved to file");
        resolve();
      });

      writeStream.on("error", (error) => {
        console.error("Error saving songs:", error);
        reject(new Error("Failed to save songs data"));
      });
    } catch (error) {
      console.error("Error saving songs:", error);
      reject(new Error("Failed to save songs data"));
    }
  });
}

export function searchSongs(query: string): ISong[] {
  const lowercaseQuery = query.toLowerCase();

  return songs.filter((song) => {
    if (
      song.title.toLowerCase().includes(lowercaseQuery) ||
      song.artist.toLowerCase().includes(lowercaseQuery)
    ) {
      return true;
    }

    // check for words in the lyrics
    return song.data.some((line) =>
      line.some(
        (item) =>
          item.lyrics && item.lyrics.toLowerCase().includes(lowercaseQuery)
      )
    );
  });
}
