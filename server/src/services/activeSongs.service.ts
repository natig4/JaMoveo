import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const ACTIVE_SONGS_FILE = path.join(DATA_DIR, "activePlayingSongs.json");

interface ActiveSongs {
  [groupId: string]: string;
}

export async function saveActiveSongs(
  activeSongs: Map<string, string>
): Promise<void> {
  try {
    if (activeSongs.size === 0) {
      console.log("No active songs to save");
      return;
    }

    const activeData: ActiveSongs = {};
    activeSongs.forEach((songId, groupId) => {
      activeData[groupId] = songId;
    });

    if (!fs.existsSync(DATA_DIR)) {
      await mkdirAsync(DATA_DIR, { recursive: true });
    }

    await writeFileAsync(
      ACTIVE_SONGS_FILE,
      JSON.stringify(activeData, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error saving active songs:", error);
  }
}

export async function loadActiveSongs(): Promise<Map<string, string>> {
  const activeSongs = new Map<string, string>();

  try {
    if (!(await existsAsync(ACTIVE_SONGS_FILE))) {
      console.log("No active songs file found, starting with empty state");
      return activeSongs;
    }

    const data = await readFileAsync(ACTIVE_SONGS_FILE, "utf8");

    const activeData = JSON.parse(data) as ActiveSongs;

    Object.entries(activeData).forEach(([groupId, songId]) => {
      activeSongs.set(groupId, songId);
    });

    console.log(`Loaded ${activeSongs.size} active songs from file`);
  } catch (error) {
    console.error("Error loading active songs:", error);
  }

  return activeSongs;
}

export function saveActiveSongsSync(activeSongs: Map<string, string>): void {
  if (activeSongs.size === 0) {
    return;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const activeData: ActiveSongs = {};
    activeSongs.forEach((songId, groupId) => {
      activeData[groupId] = songId;
    });

    const jsonData = JSON.stringify(activeData, null, 2);

    fs.writeFileSync(ACTIVE_SONGS_FILE, jsonData, "utf8");

    console.log(`[Sync] Saved ${activeSongs.size} active songs to file`);
  } catch (error) {
    console.error("[Sync] Error saving active songs:", error);
  }
}
