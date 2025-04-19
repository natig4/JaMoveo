import axios from "axios";
import { CheerioAPI, load } from "cheerio";
import { ISong, ISongItem } from "../models/types";
import { addSong, hasAddedSong } from "./songs.service";

export const CHORDS_URL = "https://www.tab4u.com";

interface WordSegment {
  word: string;
  startIdx: number;
  endIdx: number;
  isWhitespace: boolean;
}

interface ChordSegment {
  word: string;
  startIdx: number;
  endIdx: number;
}

interface CrawlerResult {
  songs: ISong[];
  hasMore: boolean;
}

let currPage = 0;

export async function crawlPopularSongs(limit = 10): Promise<CrawlerResult> {
  try {
    const url = `${CHORDS_URL}/views100.php`;

    const $ = await crawlPage(url);

    const songUrls: string[] = [];
    $("td.songTd1 a.ruSongLink.songLinkT").each(function () {
      const href = $(this).attr("href");
      if (href) songUrls.push(href);
    });

    const page = currPage * 10;

    const urlsToProcess = songUrls.slice(currPage * 10, page + limit);

    const songPromises = urlsToProcess.map((songUrl) =>
      getSongData(songUrl)
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
    const hasMore = songUrls.length > urlsToProcess.length;
    if (hasMore) {
      currPage++;
    }
    return {
      songs: validSongs,
      hasMore,
    };
  } catch (error) {
    console.error("Error crawling popular songs:", error);
    throw new Error("Failed to crawl popular songs");
  }
}

async function getSongData(songUrl: string): Promise<Omit<ISong, "id"> | null> {
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

    if (hasAddedSong(title, artist)) {
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

function getLyricSegments(
  input: string
): { word: string; startIdx: number; endIdx: number; isWhitespace: boolean }[] {
  const result = [];
  let start = null;
  let isWhitespace = false;

  for (let i = 0; i <= input.length; i++) {
    const char = input[i];
    const isCharWhitespace = /\s/.test(char);

    if (start === null && char !== undefined) {
      start = i;
      isWhitespace = isCharWhitespace;
    }

    const nextIsDifferent =
      i === input.length || isCharWhitespace !== isWhitespace;

    if (start !== null && nextIsDifferent) {
      const segment = input.slice(start, i);

      if (!isWhitespace || segment.length > 1) {
        result.push({
          word: segment,
          startIdx: start,
          endIdx: i - 1,
          isWhitespace,
        });
      }

      start = i;
      isWhitespace = isCharWhitespace;
    }
  }

  return result;
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
  if (rawLyricLine.trim().match(/^(פתיחה|מעבר|סיום|Intro|Ending|Bridge):$/)) {
    const chords = getWordsWithIndices(rawChordLine);
    const arr: ISongItem[] = chords.map((chord) => ({
      lyrics: "",
      chords: chord.word.trim(),
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

  return getWordWithChord(rawChordLine, rawLyricLine);
}

function getWordsWithIndices(
  input: string
): { word: string; startIdx: number; endIdx: number }[] {
  const result = [];
  let start = null;

  for (let i = 0; i <= input.length; i++) {
    const char = input[i];

    if (start === null && char && !/\s/.test(char)) {
      start = i;
    }

    if (start !== null && (i === input.length || /\s/.test(char))) {
      const word = input.slice(start, i);
      result.push({ word, startIdx: start, endIdx: i - 1 });
      start = null;
    }
  }

  return result;
}

function alignLyricsAndChords(
  wordPositions: WordSegment[],
  chordPositions: ChordSegment[],
  isRTL: boolean = false
): Array<ISongItem> {
  const result: Array<ISongItem> = [];
  let chordIndex = 0;

  const reverseChord = (chord: string) =>
    isRTL ? chord.split("").reverse().join("") : chord;

  for (const word of wordPositions) {
    const { startIdx, endIdx, word: lyrics, isWhitespace } = word;
    let matchedChord: string | undefined;

    while (chordIndex < chordPositions.length) {
      const chord = chordPositions[chordIndex];

      const overlaps = !(chord.endIdx < startIdx || chord.startIdx > endIdx);

      if (overlaps) {
        matchedChord = reverseChord(chord.word);
        chordIndex++;
        break;
      } else if (chord.endIdx < startIdx) {
        result.push({ lyrics: "", chords: reverseChord(chord.word) });
        chordIndex++;
      } else {
        break;
      }
    }

    if (!isWhitespace || matchedChord) {
      result.push({ lyrics, chords: matchedChord });
    }
  }

  while (chordIndex < chordPositions.length) {
    result.push({
      lyrics: "",
      chords: reverseChord(chordPositions[chordIndex].word),
    });
    chordIndex++;
  }

  return result;
}

function getWordWithChord(
  chordLine: string,
  lyricLine: string
): Array<ISongItem> {
  const isRTL = containsHebrewText(lyricLine);

  if (isRTL) {
    //For rtl we need to adjust the line a bit
    lyricLine = lyricLine.slice(1);
    chordLine = chordLine.split("").reverse().join("");
  }

  const chordPositions: Array<ChordSegment> = getWordsWithIndices(chordLine);
  const wordPositions: Array<WordSegment> = getLyricSegments(lyricLine);

  return alignLyricsAndChords(wordPositions, chordPositions, isRTL);
}

function containsHebrewText(text: string): boolean {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}
