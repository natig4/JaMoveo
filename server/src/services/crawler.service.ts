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
    const songs: ISong[] = [];

    const songUrls: string[] = [];
    $("td.songTd1 a.ruSongLink.songLinkT").each(function () {
      const href = $(this).attr("href");
      if (href) songUrls.push(href);
    });

    const urlsToProcess = songUrls.slice(0, 1);

    const songPromises = urlsToProcess.map(async (songUrl) => {
      try {
        const newSong = await getSongData(songUrl, existingTitlesAndArtists);
        console.log("newSong", newSong);

        if (newSong) {
          const song = await addSong(newSong);
          return song;
        }
      } catch (error) {
        console.error(`Error processing song URL ${songUrl}:`, error);
        return null;
      }
    });

    const fetchedSongs = await Promise.allSettled(songPromises);

    const validSongs = fetchedSongs.filter(
      (song) => song
    ) as unknown as ISong[];
    songs.push(...validSongs);

    const hasMore = songUrls.length > limit;

    return {
      songs: validSongs,
      hasMore,
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

    const newSong: Omit<ISong, "id"> = {
      title,
      artist,
      imageUrl: `${CHORDS_URL}${imageUrl.replace(/"/g, "")}`, // Clean up the URL by removing quotes
      data: songData,
    };

    return newSong;
  } catch (error) {
    console.error(`Error processing song URL: ${songUrl}`, error);
    return null;
  }
}

function getTitleAndArtist(headerText: string) {
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
        const chordRow = songPage(rows[i]);
        const lyricRow = songPage(rows[i + 1]);
        console.log("new row", i);

        const chordCells = chordRow.find("td.chords");
        const lyricCells = lyricRow.find("td.song");

        // Check if this is a chord-lyric pair
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

        //   console.log("chordRow", chordRow);
        //   console.log("lyricRow", lyricRow);

        if (isChordRow && isLyricRow) {
          // Create a new line for the song data
          const line: Array<{ lyrics: string; chords?: string }> = [];

          // Get the text from the lyric row
          const lyricText = lyricRow.text();

          // Get the chord from the chord row
          const chordText = chordRow.text();

          line.push({
            lyrics: lyricText,
            chords: chordText || undefined,
          });

          songData.push(line);
        }
      }
    });

    // console.log("foundSongData", songData);
  } catch (error) {
    console.error("Error extracting song data:", error);
  }

  return songData;
}

async function crawlPage(url: string) {
  console.log(`Crawling ${url}`);

  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    timeout: 10000,
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  return load(response.data);
}
