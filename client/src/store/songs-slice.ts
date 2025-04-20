import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ISong } from "../model/types";
import * as songsService from "../services/songs.service";
import * as crawlerService from "../services/crawler.service";

interface SongsState {
  songs: ISong[];
  filteredSongs: ISong[];
  loading: boolean;
  searchLoading: boolean;
  loadMoreLoading: boolean;
  error: string | null;
  loadMoreError: string | null;
  searchQuery: string;
  hasMoreSongs: boolean;
  initialFetchDone: boolean;
  scrollSettings: {
    interval: number;
    isScrolling: boolean;
  };
}

const initialState: SongsState = {
  songs: [],
  filteredSongs: [],
  loading: false,
  searchLoading: false,
  loadMoreLoading: false,
  error: null,
  loadMoreError: null,
  searchQuery: "",
  hasMoreSongs: true,
  initialFetchDone: false,
  scrollSettings: {
    interval: 2,
    isScrolling: false,
  },
};

export const fetchSongs = createAsyncThunk(
  "songs/fetchSongs",
  async (_, { rejectWithValue }) => {
    try {
      return await songsService.getAllSongs();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch songs"
      );
    }
  }
);

export const searchSongs = createAsyncThunk(
  "songs/searchSongs",
  async (query: string, { rejectWithValue, getState }) => {
    try {
      if (!query.trim()) {
        const state = getState() as { songs: SongsState };
        return state.songs.songs;
      }

      const songs = await songsService.searchSongs(query);
      return songs;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to search songs"
      );
    }
  }
);

export const loadMoreThenFetch = createAsyncThunk(
  "songs/loadMoreThenFetch",
  async (_, { dispatch, getState }) => {
    const state = (getState() as { songs: SongsState }).songs;
    const currentSongs = state.songs;

    const results = {
      loadMoreSuccess: false,
      fetchSuccess: false,
      loadMoreSongs: [] as ISong[],
      fetchedSongs: [] as ISong[],
      loadMoreError: null as string | null,
      fetchError: null as string | null,
      currentSongs,
    };

    try {
      const loadMoreResult = await dispatch(loadMoreSongs());

      if (loadMoreSongs.fulfilled.match(loadMoreResult)) {
        results.loadMoreSuccess = true;
        results.loadMoreSongs = loadMoreResult.payload.songs;
      } else if (loadMoreSongs.rejected.match(loadMoreResult)) {
        results.loadMoreError = loadMoreResult.payload as string;
      }
    } catch (error) {
      results.loadMoreError =
        error instanceof Error
          ? error.message
          : "Unknown error during loadMoreSongs";
    }

    // Always attempt to fetch songs regardless of what happened with loading more
    try {
      const fetchResult = await dispatch(fetchSongs());

      if (fetchSongs.fulfilled.match(fetchResult)) {
        results.fetchSuccess = true;
        results.fetchedSongs = fetchResult.payload;
      } else if (fetchSongs.rejected.match(fetchResult)) {
        results.fetchError = fetchResult.payload as string;
      }
    } catch (error) {
      results.fetchError =
        error instanceof Error
          ? error.message
          : "Unknown error during fetchSongs";
    }

    return results;
  }
);

function getUniqueSongs(existingSongs: ISong[], songs: ISong[]): ISong[] {
  const existingIds = new Set(existingSongs.map((song) => song.id));
  return songs.filter((song) => !existingIds.has(song.id));
}

export const loadMoreSongs = createAsyncThunk(
  "songs/loadMoreSongs",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { songs: SongsState };

      if (!state.songs.hasMoreSongs) {
        return { songs: [], hasMore: false };
      }

      const response = await crawlerService.fetchPopularSongs();

      return {
        songs: getUniqueSongs(state.songs.songs, response.songs),
        hasMore: response.hasMore,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to load more songs"
      );
    }
  }
);

const songsSlice = createSlice({
  name: "songs",
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      if (!action.payload) {
        state.filteredSongs = state.songs;
      }
      state.searchQuery = action.payload;
      state.error = null;
      state.loadMoreError = null;
    },
    setScrollInterval(state, action: PayloadAction<number>) {
      state.scrollSettings.interval = action.payload;
    },
    toggleScrolling(state) {
      state.scrollSettings.isScrolling = !state.scrollSettings.isScrolling;
    },
    stopScrolling(state) {
      state.scrollSettings.isScrolling = false;
    },
    clearSongsErrors(state) {
      state.error = null;
      state.loadMoreError = null;
    },
    cleanState(state) {
      state.songs = [];
      state.filteredSongs = [];
      state.loading = false;
      state.searchLoading = false;
      state.loadMoreLoading = false;
      state.error = null;
      state.loadMoreError = null;
      state.searchQuery = "";
      state.hasMoreSongs = true;
      state.initialFetchDone = false;
      state.scrollSettings = {
        interval: 2,
        isScrolling: false,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch songs cases
    builder.addCase(fetchSongs.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchSongs.fulfilled,
      (state, action: PayloadAction<ISong[]>) => {
        state.songs = action.payload;
        state.filteredSongs = action.payload;
        state.loading = false;
        state.error = null;
        state.initialFetchDone = true;
      }
    );
    builder.addCase(fetchSongs.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Search songs cases
    builder.addCase(searchSongs.pending, (state) => {
      state.searchLoading = true;
      state.error = null;
    });
    builder.addCase(
      searchSongs.fulfilled,
      (state, action: PayloadAction<ISong[]>) => {
        state.filteredSongs = action.payload;
        state.searchLoading = false;
        state.error = null;
      }
    );
    builder.addCase(searchSongs.rejected, (state, action) => {
      state.searchLoading = false;
      state.error = action.payload as string;
    });

    // Load more songs cases
    builder.addCase(loadMoreSongs.pending, (state) => {
      state.loadMoreLoading = true;
      state.loadMoreError = null;
    });
    builder.addCase(loadMoreSongs.fulfilled, (state, action) => {
      const { songs, hasMore } = action.payload;

      if (!state.searchQuery) {
        state.filteredSongs = getUniqueSongs(state.filteredSongs, songs);
      }

      state.songs = getUniqueSongs(state.songs, songs);
      state.loadMoreLoading = false;
      state.hasMoreSongs = !!hasMore;
    });
    builder.addCase(loadMoreSongs.rejected, (state, action) => {
      state.loadMoreLoading = false;
      state.loadMoreError = action.payload as string;
      console.error("Loading more songs failed:", action.payload);
    });

    builder.addCase(loadMoreThenFetch.pending, (state) => {
      state.loadMoreLoading = true;
    });

    builder.addCase(loadMoreThenFetch.fulfilled, (state, action) => {
      const results = action.payload;
      state.loadMoreLoading = false;

      // IMPORTANT: Ensure we preserve existing songs no matter what
      const allSongs: ISong[] = [...results.currentSongs];

      if (results.loadMoreSuccess && results.loadMoreSongs.length > 0) {
        const newFromCrawler = getUniqueSongs(allSongs, results.loadMoreSongs);
        allSongs.push(...newFromCrawler);
      }

      if (results.fetchSuccess && results.fetchedSongs.length > 0) {
        const newFromFetch = getUniqueSongs(allSongs, results.fetchedSongs);
        allSongs.push(...newFromFetch);
      }

      state.songs = allSongs;

      if (!state.searchQuery) {
        state.filteredSongs = allSongs;
      }

      state.loadMoreError = results.loadMoreError;
      if (results.fetchError && !state.error) {
        state.error = results.fetchError;
      }
    });

    builder.addCase(loadMoreThenFetch.rejected, (state) => {
      state.loadMoreLoading = false;
      state.loadMoreError = "Failed to execute song fetch operations";
    });
  },
});

export const {
  setSearchQuery,
  setScrollInterval,
  toggleScrolling,
  stopScrolling,
  cleanState,
  clearSongsErrors,
} = songsSlice.actions;
export default songsSlice.reducer;
