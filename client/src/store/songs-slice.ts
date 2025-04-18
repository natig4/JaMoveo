import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ISong } from "../model/types";
import * as songsService from "../services/songs.service";

interface SongsState {
  songs: ISong[];
  filteredSongs: ISong[];
  currentSong: ISong | null;
  loading: boolean;
  searchLoading: boolean;
  error: string | null;
  searchQuery: string;
  scrollSettings: {
    interval: number;
    isScrolling: boolean;
  };
}

const initialState: SongsState = {
  songs: [],
  filteredSongs: [],
  currentSong: null,
  loading: false,
  searchLoading: false,
  error: null,
  searchQuery: "",
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

export const selectSong = createAsyncThunk(
  "songs/selectSong",
  async (songId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { songs: SongsState };
      // First try to find the song in the current state
      let song =
        state.songs.songs.find((song) => song.id === songId) ||
        state.songs.filteredSongs.find((song) => song.id === songId);

      // If not found, fetch it directly
      if (!song) {
        song = await songsService.getSongById(songId);
      }

      if (!song) {
        throw new Error("Song not found");
      }

      return song;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to select song"
      );
    }
  }
);

const songsSlice = createSlice({
  name: "songs",
  initialState,
  reducers: {
    setCurrentSong(state, action: PayloadAction<ISong | null>) {
      state.currentSong = action.payload;
    },
    clearCurrentSong(state) {
      state.currentSong = null;
    },
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

    // Select song cases
    builder.addCase(selectSong.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      selectSong.fulfilled,
      (state, action: PayloadAction<ISong>) => {
        state.currentSong = action.payload;
        state.loading = false;
        state.error = null;
        state.scrollSettings.isScrolling = false;
      }
    );
    builder.addCase(selectSong.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  setCurrentSong,
  clearCurrentSong,
  setSearchQuery,
  setScrollInterval,
  toggleScrolling,
  stopScrolling,
} = songsSlice.actions;
export default songsSlice.reducer;
