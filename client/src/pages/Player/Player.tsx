import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { FaMusic } from "react-icons/fa";
import { PiMusicNoteSimpleFill } from "react-icons/pi";

import styles from "./Player.module.scss";
import AdminPlayer from "../../components/AdminPlayer/AdminPlayer";
import MusicPlayer from "../../components/MusicPlayer/MusicPlayer";
import { UserRole } from "../../model/types";
import { clearSongsErrors } from "../../store/songs-slice";
import StyledButton from "../../components/StyledButton/StyledButton";
import { useSocket } from "../../hooks/useSocket";
import { Navigate } from "react-router-dom";
import LoadingPage from "../../components/Loading/Loading";

function PlayerPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentSong, quitSong, connected, isLoading, initialize } =
    useSocket();

  const handleQuit = useCallback(() => {
    if (user?.id) {
      console.log("Quitting song");
      quitSong();
    }
  }, [quitSong, user?.id]);

  useEffect(() => {
    if (user?.id) {
      console.log("Initializing socket connection in Player component");
      initialize();
    }

    return () => {
      dispatch(clearSongsErrors());
    };
  }, [dispatch, initialize, user?.id]);

  if (!user?.instrument || !user?.groupId) {
    return <Navigate to='/user' replace />;
  }

  const renderConnectionStatus = () => {
    if (!connected) {
      return (
        <div className={styles.connectionStatus}>
          <span className={styles.disconnectedIndicator}></span>
          Disconnected - reconnecting...
        </div>
      );
    }
    return null;
  };

  const noSongMessage = (
    <div className={styles.noSongContainer}>
      <div className={styles.notesContainer}>
        <PiMusicNoteSimpleFill color='#FFCD29' size={62} />
        <FaMusic color='#FFCD29' size={50} />
      </div>
      <p className={styles.waitingMessage}>Waiting for next song...</p>
      {renderConnectionStatus()}
    </div>
  );

  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div
      className={`${styles.container} ${currentSong ? styles.playing : ""} ${
        isAdmin ? styles.admin : ""
      }`}
    >
      {isLoading && <LoadingPage text='Song' />}

      {!currentSong && !isAdmin && noSongMessage}

      {currentSong && (
        <MusicPlayer song={currentSong} instrument={user?.instrument} />
      )}

      {!currentSong && isAdmin && (
        <>
          <AdminPlayer />
          {renderConnectionStatus()}
        </>
      )}

      {isAdmin && currentSong && (
        <StyledButton
          className={`${styles.quit} ${currentSong.isHebrew ? styles.rtl : ""}`}
          onClick={handleQuit}
        >
          Quit
        </StyledButton>
      )}
    </div>
  );
}

export default PlayerPage;
