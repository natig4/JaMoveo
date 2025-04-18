import { createContext, useContext } from "react";
import { ISong } from "../model/types";

interface SocketContextValue {
  connected: boolean;
  selectSong: (songId: string) => void;
  currentSong: ISong | null;
}

export const SocketContext = createContext<SocketContextValue>({
  connected: false,
  selectSong: () => {},
  currentSong: null,
});

export const useSocket = () => useContext(SocketContext);
