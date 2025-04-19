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
  scrollSettings: {
    interval: 2,
    isScrolling: false,
  },
};

export const fetchSongs = createAsyncThunk(
  "songs/fetchSongs",
  async (_, { rejectWithValue }) => {
    try {
      const songs = await songsService.getAllSongs();
      return [...songs].sort(() => Math.random() - 0.5);
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

export const loadMoreSongs = createAsyncThunk(
  "songs/loadMoreSongs",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { songs: SongsState };

      if (!state.songs.hasMoreSongs) {
        return { songs: [], hasMore: false, nextPage: null };
      }

      const response = await crawlerService.fetchPopularSongs();

      return {
        songs: response.songs,
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
      state.searchQuery = action.payload;
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

      state.songs = [...state.songs, ...songs];

      if (!state.searchQuery) {
        state.filteredSongs = [...state.filteredSongs, ...songs];
      }

      state.loadMoreLoading = false;
      state.hasMoreSongs = !!hasMore;
    });
    builder.addCase(loadMoreSongs.rejected, (state, action) => {
      state.loadMoreLoading = false;
      state.loadMoreError = action.payload as string;
    });
  },
});

export const {
  setSearchQuery,
  setScrollInterval,
  toggleScrolling,
  stopScrolling,
  cleanState,
} = songsSlice.actions;
export default songsSlice.reducer;
