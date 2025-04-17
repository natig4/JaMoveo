import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { fetchSongs } from "../../store/songs-slice";
import styles from "./AdminPlayer.module.scss";
import Song from "../Song/Song";

export default function AdminPlayer() {
  const dispatch = useAppDispatch();
  const { songs, loading, error } = useAppSelector((state) => state.songs);

  useEffect(() => {
    dispatch(fetchSongs());
  }, [dispatch]);

  if (loading && songs.length === 0) {
    return <div className={styles.loading}>Loading songs...</div>;
  }

  if (error && songs.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.adminSection}>
      <div className={styles.header}>
        <h2>Recommended song list</h2>
      </div>

      <div className={styles.songList}>
        {songs.map((song) => (
          <Song song={song} />
        ))}
      </div>
    </div>
  );
}
