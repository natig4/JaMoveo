import axios from "axios";
import { CheerioAPI, load } from "cheerio";
import { ISong } from "../models/types";
import { getAllSongs, addSong } from "./songs.service";

interface CrawlerResult {
  songs: ISong[];
  hasMore: boolean;
}

export async function crawlPopularSongs(limit = 10): Promise<CrawlerResult> {
  try {
    // Get existing songs to avoid duplicates
    const existingSongs = getAllSongs();
    const existingTitlesAndArtists = new Set(
      existingSongs.map(
        (song) => `${song.title.toLowerCase()}|${song.artist.toLowerCase()}`
      )
    );

    const url = "https://www.tab4u.com/views100.php";

    const $ = await crawlPage(url);
    const songs: ISong[] = [];

    // Collect all song URLs
    const songUrls: string[] = [];
    $("td.songTd1 a.ruSongLink.songLinkT").each(function () {
      const href = $(this).attr("href");
      if (href) songUrls.push(href);
    });

    console.log(`Found ${songUrls.length} song URLs`);

    // Take only the number of URLs we need based on the limit
    const urlsToProcess = songUrls.slice(0, 1);

    // Use Promise.all to fetch all songs in parallel
    const songPromises = urlsToProcess.map(async (songUrl) => {
      try {
        const newSong = await getSong(songUrl, existingTitlesAndArtists);
        console.log("newSong", newSong);

        if (newSong) {
          const song = await addSong(newSong);
          return song;
        }
        // Add song to database
      } catch (error) {
        console.error(`Error processing song URL ${songUrl}:`, error);
        return null;
      }
    });

    // Wait for all song promises to resolve
    const fetchedSongs = await Promise.allSettled(songPromises);

    // Filter out null values and add to songs array
    const validSongs = fetchedSongs.filter(
      (song) => song
    ) as unknown as ISong[];
    songs.push(...validSongs);

    const uniqueSongsAdded = validSongs.length;
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

async function getSong(
  songUrl: string,
  existingTitlesAndArtists: Set<string>
): Promise<Omit<ISong, "id"> | null> {
  try {
    // Create the absolute URL if it's relative
    const fullUrl = songUrl.startsWith("http")
      ? songUrl
      : `https://www.tab4u.com/${songUrl}`;

    // Fetch and parse the song page
    const songPage = await crawlPage(fullUrl);

    // Extract artist image
    const imageUrl =
      songPage("span.artPicOnTop")
        .attr("style")
        ?.match(/url\(([^)]+)\)/)?.[1] || "";

    // Extract song title and artist from the header text
    const headerText = songPage("h1").text().trim();

    // Try different patterns to extract the title and artist
    let title = "";
    let artist = "";

    if (headerText.includes("אקורדים לשיר")) {
      // Pattern 1: "אקורדים לשיר TITLE של ARTIST"
      const match = headerText.match(/אקורדים לשיר\s+(.*?)\s+של\s+(.*?)$/);
      if (match) {
        title = match[1].trim();
        artist = match[2].trim();
      }
    }

    // If we couldn't extract from the header, try alternative elements
    if (!title || !artist) {
      // Try to get title from other elements
      title = songPage(".songTitle").text().trim();

      // Try to get artist from other elements
      artist =
        songPage(".artistTitle").text().trim() ||
        songPage("a.artistTitle").text().trim();
    }

    // Skip if we don't have both title and artist
    if (!title || !artist) {
      console.log(
        `Skipping song with incomplete info: ${title || "Unknown"} by ${
          artist || "Unknown"
        }`
      );
      return null;
    }

    // Check if song already exists in our database
    const key = `${title.toLowerCase()}|${artist.toLowerCase()}`;
    if (existingTitlesAndArtists.has(key)) {
      console.log(`Song already exists: ${title} by ${artist}`);
      return null;
    }

    // Extract lyrics and chords if available
    const songData = extractSongData(songPage);

    // Create song object
    const newSong: Omit<ISong, "id"> = {
      title,
      artist,
      imageUrl: "https://www.tab4u.com" + imageUrl.replace(/"/g, ""), // Clean up the URL by removing quotes
      data:
        songData.length > 0
          ? songData
          : [
              [{ lyrics: title, chords: "G" }],
              [{ lyrics: "by " + artist, chords: "C" }],
              [{ lyrics: "(Placeholder lyrics)", chords: "D" }],
            ],
    };

    return newSong;
  } catch (error) {
    console.error(`Error processing song URL: ${songUrl}`, error);
    return null;
  }
}

function extractSongData(songPage: CheerioAPI): ISong["data"] {
  const songData: ISong["data"] = [];

  try {
    // Try to find the song content container
    const lyricsContainer = songPage(
      ".lyrics_text, .song-content, .chordSheet"
    );

    if (lyricsContainer.length === 0) {
      return songData;
    }

    // Process each line
    lyricsContainer.find("p, div.line").each(function () {
      const line: Array<{ lyrics: string; chords?: string }> = [];
      const $line = songPage(this);

      // Simple case: just extract text and look for chord markers
      const lineText = $line.text().trim();
      if (lineText) {
        // Look for chord markers like [Am] [C] etc.
        const chordRegex = /\[([^\]]+)\]/g;
        let match;
        let lastIndex = 0;
        let lyrics = "";

        while ((match = chordRegex.exec(lineText)) !== null) {
          // Add text before the chord
          lyrics += lineText.substring(lastIndex, match.index);

          if (lyrics) {
            line.push({ lyrics });
            lyrics = "";
          }

          // Add the chord and following text
          const chordEnd = match.index + match[0].length;
          const nextChordMatch = chordRegex.exec(lineText);
          const textEnd = nextChordMatch
            ? nextChordMatch.index
            : lineText.length;
          chordRegex.lastIndex = match.index + match[0].length; // Reset regex index

          line.push({
            lyrics: lineText.substring(chordEnd, textEnd).trim(),
            chords: match[1],
          });

          lastIndex = textEnd;
        }

        // Add remaining text
        if (lastIndex < lineText.length) {
          lyrics = lineText.substring(lastIndex);
          if (lyrics) {
            line.push({ lyrics });
          }
        }

        // If no chords were found, add the entire line as lyrics
        if (line.length === 0 && lineText) {
          line.push({ lyrics: lineText });
        }
      }

      if (line.length > 0) {
        songData.push(line);
      }
    });
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
