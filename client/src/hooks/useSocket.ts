import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux-hooks";
import {
  selectSong as selectSongAction,
  quitSong as quitSongAction,
  initializeSocket,
  checkActiveSong,
  cleanupSocket,
} from "../store/socket-slice";
import { stopScrolling } from "../store/songs-slice";
import socketService from "../services/socket.service";

export function useSocket() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { connected, currentSong, isLoading, isInit } = useAppSelector(
    (state) => state.socket
  );
  const [initComplete, setInitComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initSocket = async () => {
      if (!user || isInit || initComplete) return;

      try {
        console.log("Initializing socket in useSocket hook");
        await dispatch(initializeSocket()).unwrap();
        if (isMounted) {
          setInitComplete(true);
        }
      } catch (error) {
        console.error("Failed to initialize socket:", error);
      }
    };

    initSocket();

    return () => {
      isMounted = false;
    };
  }, [user, isInit, initComplete, dispatch]);

  useEffect(() => {
    if (connected && user && initComplete) {
      console.log("Connected, checking for active song");
      dispatch(checkActiveSong());
    }
  }, [connected, user, initComplete, dispatch]);

  const selectSong = useCallback(
    async (songId: string) => {
      if (!user) return;

      try {
        console.log(`Selecting song ${songId} in useSocket hook`);
        await dispatch(selectSongAction({ userId: user.id, songId })).unwrap();
        console.log("Song selection dispatched successfully");
      } catch (error) {
        console.error("Error selecting song:", error);
      }
    },
    [user, dispatch]
  );

  const quitSong = useCallback(() => {
    if (!user) return;
    console.log("Quitting song in useSocket hook");
    dispatch(stopScrolling());
    dispatch(quitSongAction(user.id));
  }, [user, dispatch]);

  const logout = useCallback(() => {
    console.log("Logging out in useSocket hook");
    quitSong();
    dispatch(cleanupSocket());
  }, [quitSong, dispatch]);

  const initialize = useCallback(() => {
    if (!initComplete && user) {
      console.log("Manual initialization in useSocket hook");
      dispatch(initializeSocket());
      setInitComplete(true);
    }
  }, [initComplete, user, dispatch]);

  const reconnect = useCallback(async () => {
    if (user) {
      console.log("Reconnecting socket after group change");

      await dispatch(cleanupSocket()).unwrap();
      setInitComplete(false);

      socketService.reconnect();

      await dispatch(initializeSocket()).unwrap();
      setInitComplete(true);

      dispatch(checkActiveSong());
    }
  }, [user, dispatch]);

  return {
    connected,
    currentSong,
    isLoading,
    selectSong,
    logout,
    quitSong,
    initialize,
    reconnect,
  };
}
