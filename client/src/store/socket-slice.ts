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
  reconnecting: boolean;
}

const initialState: SocketState = {
  connected: false,
  currentSong: null,
  isLoading: false,
  isInit: false,
  error: null,
  reconnecting: false,
};

export const initializeSocket = createAsyncThunk(
  "socket/initialize",
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;

      if (state.socket.isInit && !state.socket.reconnecting) {
        return true;
      }

      const { user, isAuthenticated } = state.auth;
      if (!isAuthenticated || !user) {
        return rejectWithValue("User not authenticated");
      }

      const connected = await socketService.initialize(user.id);

      socketService.onConnectionChange((status) => {
        dispatch(setConnected(status));
      });

      socketService.onSongSelected((data) => {
        if (data.songId) {
          const cachedSong = songsService.getSongFromCache?.(data.songId);
          if (cachedSong) {
            dispatch(
              setCurrentSong({
                ...cachedSong,
                isHebrew: isHebrewSong(cachedSong),
              })
            );
          } else {
            dispatch(fetchSong(data.songId));
          }
        }
      });

      socketService.onSongQuit(() => {
        dispatch(setCurrentSong(null));
      });

      socketService.onAuthSuccess((data) => {
        if (data.activeSongId) {
          const cachedSong = songsService.getSongFromCache?.(data.activeSongId);
          if (cachedSong) {
            dispatch(
              setCurrentSong({
                ...cachedSong,
                isHebrew: isHebrewSong(cachedSong),
              })
            );
          } else {
            dispatch(fetchSong(data.activeSongId));
          }
        } else {
          dispatch(setIsLoading(false));
        }
      });

      return connected;
    } catch (error) {
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
    } catch {
      return false;
    }
  }
);

export const reconnectSocket = createAsyncThunk(
  "socket/reconnect",
  async (_, { dispatch, getState }) => {
    try {
      const state = getState() as RootState;
      const { user } = state.auth;

      if (!user) {
        return false;
      }

      dispatch(setReconnecting(true));

      await dispatch(cleanupSocket()).unwrap();

      await socketService.reconnect();

      await dispatch(checkActiveSong()).unwrap();

      return true;
    } catch (error) {
      console.error("Reconnection error:", error);
      return false;
    } finally {
      dispatch(setReconnecting(false));
    }
  }
);

export const checkActiveSong = createAsyncThunk(
  "socket/checkActiveSong",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;

    if (!state.socket.connected) {
      dispatch(setIsLoading(false));
      return null;
    }

    return new Promise<string | null>((resolve) => {
      dispatch(setIsLoading(true));

      const timeoutId = setTimeout(() => {
        dispatch(setIsLoading(false));
        resolve(null);
      }, 5000);

      socketService.getActiveSong((songId) => {
        clearTimeout(timeoutId);

        if (songId) {
          const cachedSong = songsService.getSongFromCache?.(songId);
          if (cachedSong) {
            dispatch(
              setCurrentSong({
                ...cachedSong,
                isHebrew: isHebrewSong(cachedSong),
              })
            );
          } else {
            dispatch(fetchSong(songId));
          }
        } else {
          dispatch(setCurrentSong(null));
          dispatch(setIsLoading(false));
        }

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

      const cachedSong = songsService.getSongFromCache?.(songId);
      await socketService.selectSong(userId, songId);

      if (cachedSong) {
        const songWithHebrew = {
          ...cachedSong,
          isHebrew: isHebrewSong(cachedSong),
        };

        dispatch(setCurrentSong(songWithHebrew));
        return songWithHebrew;
      }

      return await dispatch(fetchSong(songId)).unwrap();
    } catch (error) {
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
      dispatch(setCurrentSong(null));
      socketService.quitSong(userId);
      return null;
    } catch {
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
      if (!action.payload) {
        state.isLoading = false;
      }
    },
    setCurrentSong(state, action: PayloadAction<SongWithHebrew | null>) {
      state.isLoading = false;
      state.currentSong = action.payload;
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.isLoading = false;
      }
    },
    setReconnecting(state, action: PayloadAction<boolean>) {
      state.reconnecting = action.payload;
      if (action.payload) {
        state.connected = false;
      }
    },
    resetSocketState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Initialize socket
      .addCase(initializeSocket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeSocket.fulfilled, (state, action) => {
        state.isInit = true;
        state.connected = action.payload;
        state.error = null;
        state.reconnecting = false;
        if (!action.payload) {
          state.isLoading = false;
        }
      })
      .addCase(initializeSocket.rejected, (state, action) => {
        state.isInit = false;
        state.connected = false;
        state.isLoading = false;
        state.reconnecting = false;
        state.error = action.payload as string;
      })

      // Cleanup socket
      .addCase(cleanupSocket.fulfilled, (state) => {
        if (!state.reconnecting) {
          return initialState;
        }
        state.connected = false;
        state.isInit = false;
        state.isLoading = true;
        state.currentSong = null;
      })

      .addCase(reconnectSocket.pending, (state) => {
        state.reconnecting = true;
        state.isLoading = true;
      })
      .addCase(reconnectSocket.fulfilled, (state) => {
        state.isLoading = true;
      })
      .addCase(reconnectSocket.rejected, (state) => {
        state.reconnecting = false;
        state.isLoading = false;
        state.error = "Failed to reconnect socket";
      })

      // Fetch song
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

      // Select song
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

      // Quit song
      .addCase(quitSong.pending, (state) => {
        state.currentSong = null;
      })
      .addCase(quitSong.fulfilled, (state) => {
        state.currentSong = null;
        state.isLoading = false;
      })
      .addCase(quitSong.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const {
  setConnected,
  setCurrentSong,
  setIsLoading,
  setError,
  setReconnecting,
  resetSocketState,
} = socketSlice.actions;

export default socketSlice.reducer;
