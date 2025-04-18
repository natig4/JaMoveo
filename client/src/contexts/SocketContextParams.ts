import { createContext, useContext } from "react";
import { ISong } from "../model/types";

interface SocketContextValue {
  connected: boolean;
  selectSong: (songId: string) => void;
  quitSong: () => void;
  currentSong: ISong | null;
  isLoading?: boolean;
}

export const SocketContext = createContext<SocketContextValue>({
  connected: false,
  selectSong: () => {},
  quitSong: () => {},
  currentSong: null,
  isLoading: false,
});

export const useSocket = () => useContext(SocketContext);
