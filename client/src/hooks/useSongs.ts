import { useState, useCallback, useEffect } from "react";
import { httpGetAllSongs } from "./requests";

function useSongs() {
  const [songs, saveSongs] = useState([]);

  const getSongs = useCallback(async () => {
    const songs = await httpGetAllSongs();
    saveSongs(songs);
  }, []);

  useEffect(() => {
    getSongs();
  }, [getSongs]);

  return songs;
}

export default useSongs;
