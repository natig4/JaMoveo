import { FaPlay } from "react-icons/fa";
import { ISong } from "../../model/types";

import styles from "./Song.module.scss";
import { useAppDispatch } from "../../hooks/redux-hooks";
import { selectSong } from "../../store/songs-slice";

export default function Song({ song }: { song: ISong }) {
  const dispatch = useAppDispatch();

  const handlePlaySong = (songId: string) => {
    dispatch(selectSong(songId));
  };

  return (
    <div key={song.id} className={styles.songItem}>
      <div className={styles.songThumbnail}>
        <img
          src={song.imageUrl || "/src/assets/no-song-Image.jpg"}
          alt={song.title}
        />
      </div>
      <div className={styles.songData}>
        <div className={styles.songPreview}>
          <div className={styles.songInfo}>
            <span className={styles.songTitle}>{song.title}</span>
            <span className={styles.songTitle}> - </span>
            <span className={styles.songTitle}>{song.artist}</span>
          </div>
        </div>
        <div className={styles.songControls}>
          <button
            className={styles.playButton}
            onClick={() => handlePlaySong(song.id)}
            aria-label={`Play ${song.title} by ${song.artist}`}
          >
            <FaPlay />
          </button>
        </div>
      </div>
    </div>
  );
}
