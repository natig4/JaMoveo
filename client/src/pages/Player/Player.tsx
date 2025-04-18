// client/src/pages/Player/Player.tsx
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { FaMusic } from "react-icons/fa";
import { PiMusicNoteSimpleFill } from "react-icons/pi";

import styles from "./Player.module.scss";
import AdminPlayer from "../../components/AdminPlayer/AdminPlayer";
import MusicPlayer from "../../components/MusicPlayer/MusicPlayer";
import { UserRole } from "../../model/types";
import { stopScrolling } from "../../store/songs-slice";
import StyledButton from "../../components/StyledButton/StyledButton";
import { useSocket } from "../../contexts/SocketContextParams";

function PlayerPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentSong, quitSong } = useSocket();

  const handleQuit = () => {
    dispatch(stopScrolling());
    quitSong();
  };

  const noSongMessage = (
    <div className={styles.noSongContainer}>
      <div className={styles.notesContainer}>
        <PiMusicNoteSimpleFill color='#FFCD29' size={62} />
        <FaMusic color='#FFCD29' size={50} />
      </div>
      <p className={styles.waitingMessage}>Waiting for next song...</p>
    </div>
  );

  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div
      className={`${styles.container} ${currentSong ? styles.playing : ""} ${
        isAdmin ? styles.admin : ""
      }`}
    >
      {!currentSong && !isAdmin && noSongMessage}

      {currentSong && (
        <MusicPlayer song={currentSong} instrument={user?.instrument} />
      )}
      {!currentSong && isAdmin && (
        <>
          <AdminPlayer />
        </>
      )}

      {isAdmin && currentSong && (
        <StyledButton className={styles.quit} onClick={handleQuit}>
          Quit
        </StyledButton>
      )}
    </div>
  );
}

export default PlayerPage;
