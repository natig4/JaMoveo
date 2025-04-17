import { useAppSelector } from "../../hooks/redux-hooks";
import { FaMusic } from "react-icons/fa";
import { PiMusicNoteSimpleFill } from "react-icons/pi";

import styles from "./Player.module.scss";
import AdminPlayer from "../../components/AdminPlayer/AdminPlayer";
import MusicPlayer from "../../components/MusicPlayer/MusicPlayer";
import { UserRole } from "../../model/types";

function PlayerPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { currentSong } = useAppSelector((state) => state.songs);

  const noSongMessage = (
    <div className={styles.noSongContainer}>
      <div className={styles.notesContainer}>
        <PiMusicNoteSimpleFill color='#FFCD29' size={62} />
        <FaMusic color='#FFCD29' size={50} />
      </div>
      <p className={styles.waitingMessage}>Waiting for next song...</p>
    </div>
  );

  return (
    <div
      className={`${styles.container} ${!currentSong ? styles.loading : ""} ${
        user?.role === UserRole.ADMIN ? styles.admin : ""
      }`}
    >
      {!currentSong && user?.role === UserRole.USER
        ? noSongMessage
        : currentSong && (
            <MusicPlayer song={currentSong} instrument={user?.instrument} />
          )}

      {!currentSong && user?.role === UserRole.ADMIN && <AdminPlayer />}
    </div>
  );
}

export default PlayerPage;
