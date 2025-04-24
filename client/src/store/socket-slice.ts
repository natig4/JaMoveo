import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ISong } from "../model/types";
import { isHebrewText } from "../services/helpers.service";
import * as songsService from "../services/songs.service";
import socketService from "../services/socket.service";
import { RootState } from "./index";

function isHebrewSong(song: ISong): boolean {
  return (
    song.data.length > 0 &&
    song.data[0].length > 0 &&
    isHebrewText(song.data[0][0].lyrics)
  );
}

interface SongWithHebrew extends ISong {
  isHebrew: boolean;
}

interface SocketState {
  connected: boolean;
  currentSong: SongWithHebrew | null;
  isLoading: boolean;
  isInit: boolean;
  error: string | null;
}

const initialState: SocketState = {
  connected: false,
  currentSong: null,
  isLoading: false,
  isInit: false,
  error: null,
};

export const initializeSocket = createAsyncThunk(
  "socket/initialize",
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;

      if (state.socket.isInit) {
        return true;
      }

      const { user, isAuthenticated } = state.auth;
      if (!isAuthenticated || !user) {
        return rejectWithValue("User not authenticated");
      }

      // Initialize socket service
      const connected = await socketService.initialize(user.id);

      // Add connection change listener
      socketService.onConnectionChange((status) => {
        dispatch(setConnected(status));
      });

      // Add song selected listener
      socketService.onSongSelected((data) => {
        if (data.songId) {
          dispatch(fetchSong(data.songId));
        }
      });

      // Add song quit listener
      socketService.onSongQuit(() => {
        dispatch(setCurrentSong(null));
      });

      // Add auth success listener
      socketService.onAuthSuccess((data) => {
        if (data.activeSongId) {
          dispatch(fetchSong(data.activeSongId));
        }
      });

      return connected;
    } catch (error) {
      console.error("Failed to initialize socket:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to initialize socket"
      );
    }
  }
);

export const cleanupSocket = createAsyncThunk(
  "socket/cleanup",
  async (_, { dispatch }) => {
    try {
      socketService.disconnect();
      dispatch(resetSocketState());
      return true;
    } catch (error) {
      console.error("Error cleaning up socket:", error);
      return false;
    }
  }
);

export const checkActiveSong = createAsyncThunk(
  "socket/checkActiveSong",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;

    if (!state.socket.connected) {
      console.log("Not checking active song - socket not connected");
      return null;
    }

    return new Promise<string | null>((resolve) => {
      dispatch(setIsLoading(true));

      socketService.getActiveSong((songId) => {
        console.log("Active song check result:", songId);

        if (songId) {
          dispatch(fetchSong(songId));
        } else {
          dispatch(setCurrentSong(null));
        }

        dispatch(setIsLoading(false));
        resolve(songId);
      });
    });
  }
);

export const fetchSong = createAsyncThunk(
  "socket/fetchSong",
  async (songId: string, { rejectWithValue }) => {
    try {
      const song = await songsService.getSongById(songId);
      return {
        ...song,
        isHebrew: isHebrewSong(song),
      };
    } catch (error) {
      console.error("Error fetching song:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch song"
      );
    }
  }
);

export const selectSong = createAsyncThunk(
  "socket/selectSong",
  async (
    { userId, songId }: { userId: string; songId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setIsLoading(true));

      // Send the selection to the socket
      await socketService.selectSong(userId, songId);

      // Fetch the song data
      const songData = await dispatch(fetchSong(songId)).unwrap();

      return songData;
    } catch (error) {
      console.error("Error selecting song:", error);
      dispatch(setIsLoading(false));
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to select song"
      );
    }
  }
);

export const quitSong = createAsyncThunk(
  "socket/quitSong",
  async (userId: string, { dispatch }) => {
    try {
      socketService.quitSong(userId);
      dispatch(setCurrentSong(null));
      return null;
    } catch (error) {
      console.error("Error quitting song:", error);
      return null;
    }
  }
);

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
    },
    setCurrentSong(state, action: PayloadAction<ISong | null>) {
      state.isLoading = false;
      if (action.payload) {
        state.currentSong = {
          ...action.payload,
          isHebrew: isHebrewSong(action.payload),
        };
      } else {
        state.currentSong = null;
      }
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    resetSocketState: () => initialState,
  },
  extraReducers: (builder) => {
    builder

      .addCase(initializeSocket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeSocket.fulfilled, (state, action) => {
        state.isInit = true;
        state.connected = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(initializeSocket.rejected, (state, action) => {
        state.isInit = false;
        state.connected = false;
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(cleanupSocket.fulfilled, () => {
        return initialState;
      })

      .addCase(fetchSong.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSong.fulfilled, (state, action) => {
        state.currentSong = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchSong.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(selectSong.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(selectSong.fulfilled, (state, action) => {
        state.currentSong = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(selectSong.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(quitSong.fulfilled, (state) => {
        state.currentSong = null;
        state.isLoading = false;
      });
  },
});

export const {
  setConnected,
  setCurrentSong,
  setIsLoading,
  setError,
  resetSocketState,
} = socketSlice.actions;

export default socketSlice.reducer;
