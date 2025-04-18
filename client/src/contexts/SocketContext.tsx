import React, { useEffect, useState } from "react";
import socketService from "../services/socket.service";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { ISong } from "../model/types";
import { SocketContext } from "./SocketContextParams";
import * as songsService from "../services/songs.service";

interface SocketContextProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketContextProps> = ({ children }) => {
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const [connected, setConnected] = useState(false);
  const [currentSong, setCurrentSong] = useState<ISong | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    socketService.initialize(user.id);

    const intervalId = setInterval(() => {
      setConnected(socketService.isConnected());
    }, 3000);

    socketService.onSongSelected(async ({ songId }) => {
      console.log("Song selected via socket:", songId);
      try {
        const song = await songsService.getSongById(songId);
        setCurrentSong(song);
      } catch (error) {
        console.error("Error fetching selected song:", error);
      }
    });

    return () => {
      clearInterval(intervalId);
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  const selectSong = (songId: string) => {
    if (!user) return;
    socketService.selectSong(user.id, songId);
  };

  return (
    <SocketContext.Provider value={{ connected, selectSong, currentSong }}>
      {children}
    </SocketContext.Provider>
  );
};
