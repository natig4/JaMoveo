import axios from "axios";
import { CheerioAPI, load } from "cheerio";
import { ISong, ISongItem } from "../models/types";
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
      hasMore: songUrls.length > urlsToProcess.length,
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
    ).not(".br");

    songTables.each(function () {
      const $table = songPage(this);

      // Skip hidden tables
      if (
        $table.attr("style")?.includes("display: none") ||
        $table.attr("style")?.includes("display:none")
      ) {
        return;
      }

      const rows = $table.find("tr");
      const processedRows: Array<{ type: "chord" | "lyric"; content: string }> =
        [];

      rows.each((_i, rowEl) => {
        const $row = songPage(rowEl);

        if (
          $row.attr("style")?.includes("display: none") ||
          $row.attr("style")?.includes("display:none")
        ) {
          return;
        }

        const cells = $row.find("td");

        if (!cells.length || !cells.text().trim()) return;

        if (
          cells.attr("style")?.includes("display: none") ||
          cells.attr("style")?.includes("display:none")
        ) {
          return;
        }

        let rowType: "chord" | "lyric" | null = null;
        const content = cells.text().trim();

        if (
          cells.hasClass("chords") ||
          cells.find(".chords").length ||
          cells.attr("class")?.includes("chords") ||
          content.split(/\s+/).some(isChordText)
        ) {
          rowType = "chord";
        } else if (
          cells.hasClass("song") ||
          cells.find(".song").length ||
          content.length > 0
        ) {
          rowType = "lyric";
        }

        if (rowType) {
          processedRows.push({ type: rowType, content });
        }
      });

      processChordAndLyricPairs(processedRows, songData);
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

function processChordAndLyricPairs(
  processedRows: Array<{ type: "chord" | "lyric"; content: string }>,
  songData: ISong["data"]
) {
  for (let i = 0; i < processedRows.length; i++) {
    const current = processedRows[i];
    const next = i + 1 < processedRows.length ? processedRows[i + 1] : null;

    if (current.type === "chord" && next && next.type === "lyric") {
      const line = parseChordAndLyric(current.content, next.content);
      if (line.length > 0) {
        songData.push(line);
      }
      i++;
    } else if (current.type === "lyric" && next && next.type === "chord") {
      const line = parseChordAndLyric(next.content, current.content);
      if (line.length > 0) {
        songData.push(line);
      }
      i++;
    }
  }
}

function parseChordAndLyric(chordLine: string, lyricLine: string): ISongItem[] {
  // Clean inputs
  const cleanChordLine = chordLine.replace(/&nbsp;/g, " ").trim();
  const cleanLyricLine = lyricLine.replace(/&nbsp;/g, " ").trim();

  console.log("Clean chord line:", cleanChordLine);
  console.log("Clean lyric line:", cleanLyricLine);

  // Special case handling for completely empty lines
  if (!cleanLyricLine && !cleanChordLine) {
    return [];
  }

  // Handle case with only chords, no lyrics
  if (!cleanLyricLine && cleanChordLine) {
    return cleanChordLine
      .split(/\s+/)
      .filter(Boolean)
      .map((chord) => ({
        lyrics: "",
        chords: chord,
      }));
  }

  // Handle case with only lyrics, no chords
  if (!cleanChordLine && cleanLyricLine) {
    return cleanLyricLine
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({
        lyrics: word,
        chords: "",
      }));
  }

  // Special case for section headers like "מעבר:" or "סיום:"
  if (cleanLyricLine.match(/^(מעבר|סיום):$/)) {
    return [
      {
        lyrics: cleanLyricLine,
        chords: cleanChordLine,
      },
    ];
  }

  // For normal lyric lines with chords in Hebrew (RTL):
  // 1. Get all lyrics and chords as arrays
  const lyricWords = cleanLyricLine.split(/\s+/).filter(Boolean);
  const chordWords = cleanChordLine.split(/\s+/).filter(Boolean);

  // 2. Create the result array
  const result: ISongItem[] = [];

  // 3. Match chords to lyrics based on RTL order:
  // - The first chord corresponds to the last word (rightmost in Hebrew)
  // - The second chord corresponds to the second-to-last word
  // - And so on...
  for (let i = 0; i < lyricWords.length; i++) {
    // Get the lyric word from left-to-right order (as stored in the array)
    const lyricWord = lyricWords[i];

    // Calculate the corresponding chord index based on RTL order
    // The first chord (index 0) should match the last word (index lyricWords.length-1)
    const chordIndex = lyricWords.length - 1 - i;

    // Get the chord if available, or empty string
    const chord =
      chordIndex >= 0 && chordIndex < chordWords.length
        ? chordWords[chordIndex]
        : "";

    result.push({
      lyrics: lyricWord,
      chords: chord,
    });
  }

  // If there are extra chords, add them as standalone items at the beginning
  if (chordWords.length > lyricWords.length) {
    const extraChords = chordWords.slice(
      0,
      chordWords.length - lyricWords.length
    );
    for (const chord of extraChords) {
      result.unshift({
        lyrics: "",
        chords: chord,
      });
    }
  }

  return result;
}

function isChordText(text: string): boolean {
  return /^[A-Ga-g][#b]?(m|M|maj|min|dim|aug|sus|add)?[0-9]*(\/[A-Ga-g][#b]?)?$/.test(
    text.trim()
  );
}
