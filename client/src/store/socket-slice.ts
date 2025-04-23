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
}

const initialState: SocketState = {
  connected: false,
  currentSong: null,
  isLoading: false,
  isInit: false,
};

export const initializeSocket = createAsyncThunk(
  "socket/initialize",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;

    if (state.socket.isInit) {
      return true;
    }

    const { user, isAuthenticated } = state.auth;
    if (!isAuthenticated || !user) {
      return false;
    }

    socketService.initialize(user.id);

    socketService.onConnectionChange((status) => {
      dispatch(setConnected(status));
    });

    socketService.onSongSelected((data) => {
      if (data.songId) {
        dispatch(fetchSong(data.songId));
      }
    });

    socketService.onSongQuit(() => {
      dispatch(setCurrentSong(null));
    });

    return true;
  }
);

export const cleanupSocket = createAsyncThunk("socket/cleanup", async () => {
  socketService.disconnect();
  return true;
});

export const handleSongQuit = createAsyncThunk(
  "socket/handleSongQuit",
  async (_, { dispatch }) => {
    dispatch(setCurrentSong(null));
    return null;
  }
);

export const fetchSong = createAsyncThunk(
  "socket/fetchSong",
  async (songId: string) => {
    const song = await songsService.getSongById(songId);
    return {
      ...song,
      isHebrew: isHebrewSong(song),
    };
  }
);

export const checkActiveSong = createAsyncThunk(
  "socket/checkActiveSong",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    if (!state.socket.connected) {
      return null;
    }

    return new Promise<string | null>((resolve) => {
      socketService.getActiveSong((songId) => {
        if (songId) {
          dispatch(fetchSong(songId));
        } else {
          dispatch(setCurrentSong(null));
        }
        resolve(songId);
      });
    });
  }
);

export const selectSong = createAsyncThunk(
  "socket/selectSong",
  async (
    { userId, songId }: { userId: string; songId: string },
    { dispatch }
  ) => {
    try {
      dispatch(setIsLoading(true));
      await socketService.selectSong(userId, songId);

      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Song selection timed out slice"));
        }, 5000);
      });

      return await Promise.race([
        dispatch(fetchSong(songId)).unwrap(),
        timeoutPromise,
      ]);
    } catch (error) {
      dispatch(setIsLoading(false));
      console.error("Error selecting song:", error);
      throw error;
    }
  }
);

export const quitSong = createAsyncThunk(
  "socket/quitSong",
  async (userId: string, { dispatch }) => {
    socketService.quitSong(userId);
    dispatch(setCurrentSong(null));
    return null;
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
    resetSocketState() {
      return {
        ...initialState,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSocket.fulfilled, (state, action) => {
        if (action.payload) {
          state.isInit = true;
        }
      })

      .addCase(cleanupSocket.fulfilled, (state) => {
        state.connected = false;
        state.currentSong = null;
        state.isLoading = false;
        state.isInit = false;
      })

      .addCase(fetchSong.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSong.fulfilled, (state, action) => {
        state.currentSong = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchSong.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(selectSong.fulfilled, (state) => {
        state.isLoading = true;
      })

      .addCase(selectSong.rejected, (state, action) => {
        console.log("selectSong.rejected", action.payload);

        state.isLoading = false;
      })

      .addCase(quitSong.fulfilled, (state) => {
        state.currentSong = null;
      });
  },
});

export const { setConnected, setCurrentSong, setIsLoading, resetSocketState } =
  socketSlice.actions;

export default socketSlice.reducer;
