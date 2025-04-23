import { ISong } from "../model/types";
import { API_URL } from "./helpers.service";
import { addSongsToCache } from "./songs.service";

interface PopularSongsResponse {
  success: boolean;
  songs: ISong[];
  hasMore: boolean;
  nextPage: number | null;
  message?: string;
}

export async function fetchPopularSongs(
  limit = 10
): Promise<PopularSongsResponse> {
  try {
    const response = await fetch(
      `${API_URL}/crawler/popular-songs?limit=${limit}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Failed to fetch popular songs: ${response.status}`
      );
    }

    const data = await response.json();
    addSongsToCache(data.songs);
    return data as PopularSongsResponse;
  } catch (error) {
    console.error("Error fetching popular songs:", error);
    throw error;
  }
}
