import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./redux-hooks";
import {
  selectSong as selectSongAction,
  quitSong as quitSongAction,
  initializeSocket,
  checkActiveSong,
} from "../store/socket-slice";

export function useSocket() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { connected, currentSong, isLoading } = useAppSelector(
    (state) => state.socket
  );

  useEffect(() => {
    if (connected && user) {
      dispatch(checkActiveSong());
    }
  }, [connected, user, dispatch]);

  const selectSong = (songId: string) => {
    if (!user) return;
    dispatch(selectSongAction({ userId: user.id, songId }));
  };

  const quitSong = () => {
    if (!user) return;
    dispatch(quitSongAction(user.id));
  };

  return {
    connected,
    currentSong,
    isLoading,
    selectSong,
    quitSong,
    initialize: () => dispatch(initializeSocket()),
  };
}
