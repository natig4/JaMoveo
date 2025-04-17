import { useAppSelector } from "../../hooks/redux-hooks";
import { FaMusic } from "react-icons/fa";
import { PiMusicNoteSimpleFill } from "react-icons/pi";

import styles from "./Player.module.scss";
import AdminPlayer from "../../components/AdminPlayer/AdminPlayer";
// import MusicPlayer from "../../components/MusicPlayer/MusicPlayer";

function PlayerPage() {
  const { user } = useAppSelector((state) => state.auth);
  const noSong = true;

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
    <div className={`${styles.container} ${noSong ? styles.loading : ""}`}>
      {
        noSong ? noSongMessage : null
        // <MusicPlayer song={song} instrument={user!.instrument}/>
      }

      {user?.role === "admin" && <AdminPlayer />}
    </div>
  );
}

export default PlayerPage;
