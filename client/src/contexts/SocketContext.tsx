import React, { useEffect, useState, useCallback } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [activeCheckDone, setActiveCheckDone] = useState(false);

  const handleConnectionChange = useCallback((status: boolean) => {
    setConnected(status);

    if (!status) {
      setActiveCheckDone(false);
    }
  }, []);

  const fetchSong = useCallback(async (songId: string) => {
    if (!songId) return;

    setIsLoading(true);
    try {
      const song = await songsService.getSongById(songId);
      setCurrentSong(song);
    } catch (error) {
      console.error("Error fetching selected song:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSongSelected = useCallback(
    ({ songId }: { songId: string }) => {
      if (songId) {
        fetchSong(songId);
      }
    },
    [fetchSong]
  );

  const handleSongQuit = useCallback(() => {
    setCurrentSong(null);
  }, []);

  useEffect(() => {
    if (!user || !connected || activeCheckDone) return;

    setActiveCheckDone(true);

    socketService.getActiveSong((songId) => {
      if (!songId) {
        return;
      }

      fetchSong(songId);
    });
  }, [user, connected, activeCheckDone, fetchSong]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    socketService.initialize(user.id);

    const connectionUnsubscribe = socketService.onConnectionChange(
      handleConnectionChange
    );
    const songSelectedUnsubscribe =
      socketService.onSongSelected(handleSongSelected);
    const songQuitUnsubscribe = socketService.onSongQuit(handleSongQuit);

    return () => {
      connectionUnsubscribe();
      if (songSelectedUnsubscribe) songSelectedUnsubscribe();
      if (songQuitUnsubscribe) songQuitUnsubscribe();
      socketService.disconnect();
    };
  }, [
    isAuthenticated,
    user,
    handleConnectionChange,
    handleSongSelected,
    handleSongQuit,
  ]);

  const selectSong = useCallback(
    (songId: string) => {
      if (!user) return;
      setIsLoading(true);

      socketService.selectSong(user.id, songId);
    },
    [user]
  );

  const quitSong = useCallback(() => {
    if (!user) return;
    socketService.quitSong(user.id);
    setCurrentSong(null);
  }, [user]);

  const contextValue = {
    connected,
    selectSong,
    quitSong,
    currentSong,
    isLoading,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
