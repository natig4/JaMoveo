import axios from "axios";
import { CheerioAPI, load } from "cheerio";
import { ISong, ISongItem } from "../models/types";
import { getAllSongs, addSong } from "./songs.service";

export const CHORDS_URL = "https://www.tab4u.com";

let wordCount = 0;

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
        const content = cells.text();

        if (
          cells.hasClass("chords") ||
          cells.find(".chords").length ||
          cells.attr("class")?.includes("chords")
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
  const rawChordLine = chordLine.replace(/(&nbsp;|\n|\t)/g, " ");
  const rawLyricLine = lyricLine.replace(/(&nbsp;|\n|\t)/g, " ");

  if (!rawChordLine && !rawLyricLine) {
    return [];
  }

  // Special case: section headers (מעבר:, סיום:, etc.)
  if (rawLyricLine.trim().match(/^(מעבר|סיום):$/)) {
    const chords = extractChords(rawChordLine);
    const arr: ISongItem[] = chords.map((chord) => ({
      lyrics: "",
      chords: chord.trim(),
    }));

    if (arr.length > 0) {
      arr[0].lyrics = rawLyricLine.trim();
    } else {
      arr.push({
        lyrics: rawLyricLine.trim(),
        chords: "",
      });
    }

    return arr;
  }

  // For Hebrew (RTL) text, we need to be careful about the alignment
  const isHebrew = containsHebrewText(rawLyricLine);

  // Use character-by-character alignment to preserve spaces
  return alignChordsWithLyrics(rawChordLine, rawLyricLine, isHebrew);
}

function getWordWithChord(chordLine: string, lyricLine: string) {
  const words: { word: string; chord?: string; isWhitespace?: boolean }[] = [];
  chordLine = chordLine.split("").reverse().join("");
  console.log("lyricLine", lyricLine);

  let currentStart = 0;
  let isCurrentWhitespace = /\s/.test(lyricLine[0] || "");

  // Process character by character
  for (let i = 0; i < lyricLine.length; i++) {
    const char = lyricLine[i];
    const isCharWhitespace = /\s/.test(char);

    // If we transition between whitespace and non-whitespace (in either direction)
    if (isCharWhitespace !== isCurrentWhitespace) {
      // Save the previous segment (word or whitespace)
      const segment = lyricLine.substring(currentStart, i);

      words.push({
        word: segment,
        isWhitespace: isCurrentWhitespace,
      });

      // Start a new segment
      currentStart = i;
      isCurrentWhitespace = isCharWhitespace;
    }
  }

  // Handle the last segment
  const lastSegment = lyricLine.substring(currentStart);
  if (lastSegment) {
    words.push({
      word: lastSegment,
      isWhitespace: isCurrentWhitespace,
    });
  }

  // Filter the results
  const filteredWords = words.filter((item, index) => {
    // Keep all non-whitespace words
    if (!item.isWhitespace) {
      return true;
    }

    // For whitespace:
    // 1. Skip leading whitespace (index 0)
    if (index === 0) {
      return false;
    }

    // 2. Skip trailing whitespace (last item)
    if (index === words.length - 1) {
      return false;
    }

    // 3. Keep middle whitespace only if it's more than 1 character
    return item.word.length > 1;
  });

  // Remove the isWhitespace flag from the result
  const result = filteredWords.map(({ word, chord }) => ({
    word,
    ...(chord && { chord }),
  }));

  wordCount++;
  console.log("words", result);
  return result;
}

function alignChordsWithLyrics(
  chordLine: string,
  lyricLine: string,
  isRTL: boolean
): ISongItem[] {
  const result: ISongItem[] = [];

  // First identify words and their positions in the lyric line
  const lyricWords: { word: string; startPos: number }[] = [];
  const lyricWordPattern = /\S+/g;
  let match;
  if (wordCount < 4) {
    getWordWithChord(chordLine, lyricLine);
  }

  while ((match = lyricWordPattern.exec(lyricLine)) !== null) {
    lyricWords.push({
      word: match[0],
      startPos: match.index,
    });
  }

  // If no lyric words, create a single item with empty lyrics
  if (lyricWords.length === 0) {
    // Just extract chords
    const chords = extractChords(chordLine);
    return chords.map((chord) => ({
      lyrics: "",
      chords: chord.trim(),
    }));
  }

  // Identify chords and their positions
  const chordPositions: { chord: string; startPos: number }[] = [];
  const chordPattern =
    /[A-Ga-g][#b]?(m|M|maj|min|dim|aug|sus|add)?[0-9]*(\/[A-Ga-g][#b]?)?/g;

  while ((match = chordPattern.exec(chordLine)) !== null) {
    chordPositions.push({
      chord: match[0],
      startPos: match.index,
    });
  }

  // Create song items for each lyric word
  for (const lyricWord of lyricWords) {
    const item: ISongItem = {
      lyrics: lyricWord.word,
      chords: "",
    };

    // Find chord that aligns with this word
    for (const chordPos of chordPositions) {
      // For RTL languages like Hebrew, check if chord is close to the lyric word
      // This is a simplified approach and may need adjustment based on your exact requirements
      if (isRTL) {
        // In RTL, we'll consider a chord aligned if it's close to the word's position
        // This is approximate and may need fine-tuning
        if (Math.abs(chordPos.startPos - lyricWord.startPos) < 3) {
          item.chords = chordPos.chord;
          break;
        }
      } else {
        // For LTR languages, chord belongs to the word if it starts at or just before the word
        if (
          chordPos.startPos <= lyricWord.startPos &&
          (chordPos.startPos + chordPos.chord.length > lyricWord.startPos ||
            chordPos.startPos + chordPos.chord.length + 1 ===
              lyricWord.startPos)
        ) {
          item.chords = chordPos.chord;
          break;
        }
      }
    }

    result.push(item);
  }

  // Add any remaining chords that don't align with lyrics
  for (const chordPos of chordPositions) {
    let isAligned = false;

    for (const item of result) {
      if (item.chords === chordPos.chord) {
        isAligned = true;
        break;
      }
    }

    if (!isAligned) {
      result.push({
        lyrics: "",
        chords: chordPos.chord,
      });
    }
  }

  return result;
}

function extractChords(line: string): string[] {
  const chordPattern =
    /[A-Ga-g][#b]?(m|M|maj|min|dim|aug|sus|add)?[0-9]*(\/[A-Ga-g][#b]?)?/g;
  return line.match(chordPattern) || [];
}

function containsHebrewText(text: string): boolean {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}
