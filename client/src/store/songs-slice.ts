import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ISong } from "../model/types";
import * as songsService from "../services/songs.service";

interface SongsState {
  songs: ISong[];
  currentSong: ISong | null;
  loading: boolean;
  error: string | null;
}

const initialState: SongsState = {
  songs: [],
  currentSong: null,
  loading: false,
  error: null,
};

export const fetchSongs = createAsyncThunk(
  "songs/fetchSongs",
  async (_, { rejectWithValue }) => {
    try {
      const songs = await songsService.getAllSongs();
      // Randomize songs order
      return [...songs].sort(() => Math.random() - 0.5);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch songs"
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
      let song = state.songs.songs.find((song) => song.id === songId);

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
        state.loading = false;
        state.error = null;
      }
    );
    builder.addCase(fetchSongs.rejected, (state, action) => {
      state.loading = false;
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
      }
    );
    builder.addCase(selectSong.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setCurrentSong, clearCurrentSong } = songsSlice.actions;
export default songsSlice.reducer;
