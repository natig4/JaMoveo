import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./redux-hooks";
import {
  selectSong as selectSongAction,
  quitSong as quitSongAction,
  initializeSocket,
  checkActiveSong,
  cleanupSocket,
} from "../store/socket-slice";
import { stopScrolling } from "../store/songs-slice";

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
      dispatch(checkActiveSong());
    }
  }, [connected, user, initComplete, dispatch]);

  const selectSong = async (songId: string) => {
    if (!user) return;

    try {
      await dispatch(selectSongAction({ userId: user.id, songId })).unwrap();
      console.log("Song selection dispatched successfully");
    } catch (error) {
      console.error("Error selecting song:", error);
    }
  };

  const quitSong = () => {
    if (!user) return;
    dispatch(stopScrolling());
    dispatch(quitSongAction(user.id));
  };

  const logout = () => {
    quitSong();
    dispatch(cleanupSocket());
  };

  return {
    connected,
    currentSong,
    isLoading,
    selectSong,
    logout,
    quitSong,
    initialize: () => {
      if (!initComplete && user) {
        dispatch(initializeSocket());
        setInitComplete(true);
      }
    },
  };
}
