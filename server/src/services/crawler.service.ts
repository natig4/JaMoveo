import axios from "axios";
import { CheerioAPI, load } from "cheerio";
import { ISong } from "../models/types";
import { getAllSongs, addSong } from "./songs.service";

export const CHORDS_URL = "https://www.tab4u.com";

interface CrawlerResult {
  songs: ISong[];
  hasMore: boolean;
}

export async function crawlPopularSongs(limit = 10): Promise<CrawlerResult> {
  try {
    const existingSongs = getAllSongs();
    const existingTitlesAndArtists = new Set(
      existingSongs.map(
        (song) => `${song.title.toLowerCase()}|${song.artist.toLowerCase()}`
      )
    );

    const url = `${CHORDS_URL}/views100.php`;

    const $ = await crawlPage(url);

    const songUrls: string[] = [];
    $("td.songTd1 a.ruSongLink.songLinkT").each(function () {
      const href = $(this).attr("href");
      if (href) songUrls.push(href);
    });

    const urlsToProcess = songUrls.slice(0, 1);

    const songPromises = urlsToProcess.map((songUrl) =>
      getSongData(songUrl, existingTitlesAndArtists)
        .then((songData) => {
          if (!songData) return null;
          return addSong(songData);
        })
        .catch((error) => {
          console.error(`Error processing song URL ${songUrl}:`, error);
          return null;
        })
    );

    const fetchedResults = await Promise.allSettled(songPromises);

    const validSongs = fetchedResults
      .filter(
        (result): result is PromiseFulfilledResult<ISong> =>
          result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value);

    return {
      songs: validSongs,
      hasMore: songUrls.length > limit,
    };
  } catch (error) {
    console.error("Error crawling popular songs:", error);
    throw new Error("Failed to crawl popular songs");
  }
}

async function getSongData(
  songUrl: string,
  existingTitlesAndArtists: Set<string>
): Promise<Omit<ISong, "id"> | null> {
  try {
    const fullUrl = songUrl.startsWith("http")
      ? songUrl
      : `${CHORDS_URL}/${songUrl}`;

    const songPage = await crawlPage(fullUrl);

    const imageUrl =
      songPage("span.artPicOnTop")
        .attr("style")
        ?.match(/url\(([^)]+)\)/)?.[1] || "";

    const headerText = songPage("h1").text().trim();

    const { title, artist } = getTitleAndArtist(headerText);

    if (!title || !artist) {
      return null;
    }

    const key = `${title.toLowerCase()}|${artist.toLowerCase()}`;
    if (existingTitlesAndArtists.has(key)) {
      return null;
    }

    const songData = extractSongData(songPage);

    if (songData.length === 0) {
      return null;
    }

    const newSong: Omit<ISong, "id"> = {
      title,
      artist,
      imageUrl: imageUrl ? `${CHORDS_URL}${imageUrl.replace(/"/g, "")}` : "",
      data: songData,
    };

    return newSong;
  } catch (error) {
    console.error(`Error processing song URL: ${songUrl}`, error);
    return null;
  }
}

function getTitleAndArtist(headerText: string): {
  title: string;
  artist: string;
} {
  let title = "";
  let artist = "";

  if (headerText.includes("אקורדים לשיר")) {
    const match = headerText.match(/אקורדים לשיר\s+(.*?)\s+של\s+(.*?)$/);
    if (match) {
      title = match[1].trim();
      artist = match[2].trim();
    }
  }

  return { title, artist };
}

function extractSongData(songPage: CheerioAPI): ISong["data"] {
  const songData: ISong["data"] = [];

  try {
    const songTables = songPage(
      'table[border="0"][cellspacing="0"][cellpadding="0"]'
    );

    songTables.each(function () {
      const $table = songPage(this);
      const rows = $table.find("tr");

      for (let i = 0; i < rows.length; i += 2) {
        if (i + 1 >= rows.length) break; // Ensure we have pairs

        const chordRow = songPage(rows[i]);
        const lyricRow = songPage(rows[i + 1]);

        const chordCells = chordRow.find("td.chords");
        const lyricCells = lyricRow.find("td.song");

        if (chordCells.length === 0 || lyricCells.length === 0) continue;

        const firstChordCell = chordCells.first();
        const firstLyricCell = lyricCells.first();

        const isChordRow =
          firstChordCell.hasClass("chords") ||
          firstChordCell
            .text()
            .trim()
            .match(/^[A-G][#b]?m?7?$/);

        const isLyricRow =
          firstLyricCell.hasClass("song") ||
          (!isChordRow && firstLyricCell.text().trim().length > 0);

        if (!isChordRow && !isLyricRow) continue;

        const line: Array<{ lyrics: string; chords?: string }> = [];

        const lyricText = lyricRow.text().trim();
        if (!lyricText) continue;

        const chordText = chordRow.text().trim();

        line.push({
          lyrics: lyricText,
          chords: chordText || undefined,
        });

        songData.push(line);
      }
    });
  } catch (error) {
    console.error("Error extracting song data:", error);
  }

  return songData;
}

async function crawlPage(url: string): Promise<CheerioAPI> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 15000,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    return load(response.data);
  } catch (error) {
    console.error(`Error crawling page ${url}:`, error);
    throw error;
  }
}
