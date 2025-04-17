import { useAppSelector } from "../../hooks/redux-hooks";
import { GiMusicalNotes } from "react-icons/gi";

import styles from "./Player.module.scss";

function PlayerPage() {
  const { user } = useAppSelector((state) => state.auth);
  const noSong = true;

  const noSongMessage = (
    <div className={styles.noSongContainer}>
      <GiMusicalNotes color='#FFCD29' size={88} />
      <p className={styles.waitingMessage}>Waiting for next song...</p>
    </div>
  );

  return (
    <div className={`${styles.container} ${noSong ? styles.loading : ""}`}>
      {noSong ? (
        noSongMessage
      ) : (
        <>
          <h1>Song Player</h1>
          <p>This is where lyrics and chords will be displayed</p>
        </>
      )}

      {user && user.role === "admin" && (
        <div className='admin-section'>
          <h2>Admin Controls</h2>
          <div className='song-selection'>
            <h3>Choose Song</h3>
            <p>Song selection interface will go here</p>
          </div>

          <div className='available-songs'>
            <h3>Available Songs</h3>
            <p>List of available songs will go here</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerPage;
