import { FaPlay } from "react-icons/fa";
import { ISong, UserRole } from "../../model/types";

import styles from "./Song.module.scss";
import { useAppSelector } from "../../hooks/redux-hooks";
import { useSocket } from "../../hooks/useSocket";

export default function Song({ song }: { song: ISong }) {
  const { user } = useAppSelector((state) => state.auth);
  const { selectSong, connected } = useSocket();

  const handlePlaySong = () => {
    if (user?.role === UserRole.USER) {
      return;
    }

    selectSong(song.id);

    if (!connected) {
      console.warn(
        "Socket not connected. Song selection will be queued and sent when connection is restored."
      );
    }
  };

  return (
    <div key={song.id} className={styles.songItem}>
      <div className={styles.songThumbnail}>
        <img
          src={song.imageUrl || "https://www.tab4u.com/images/noArtPicDu.svg"}
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
            onClick={() => handlePlaySong()}
            aria-label={`Play ${song.title} by ${song.artist}`}
          >
            <FaPlay />
          </button>
        </div>
      </div>
    </div>
  );
}
