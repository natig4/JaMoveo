import { FaPlay, FaPause, FaPlus, FaMinus } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux-hooks";
import { setScrollInterval, toggleScrolling } from "../../../store/songs-slice";
import styles from "./ScrollManager.module.scss";

interface ScrollManagerProps {
  isRtl: boolean;
}

export default function ScrollManager({ isRtl }: ScrollManagerProps) {
  const dispatch = useAppDispatch();
  const { interval, isScrolling } = useAppSelector(
    (state) => state.songs.scrollSettings
  );

  const toggleAutoScroll = () => {
    dispatch(toggleScrolling());
  };

  const handleScrollIntervalChange = (action: "increase" | "decrease") => {
    const change = action === "increase" ? 0.5 : -0.5;
    const newInterval = interval + change;

    if (newInterval >= 0.5 && newInterval <= 10) {
      dispatch(setScrollInterval(newInterval));
    }
  };

  return (
    <div className={`${styles.controlsContainer} ${isRtl ? styles.rtl : ""}`}>
      <div className={styles.speedControls}>
        <button
          className={styles.speedButton}
          onClick={() => handleScrollIntervalChange("decrease")}
          disabled={interval <= 0.5}
          aria-label='Decrease scroll speed'
        >
          <FaMinus />
        </button>

        <button
          className={`${styles.controlButton} ${
            isScrolling ? styles.active : ""
          }`}
          onClick={toggleAutoScroll}
          aria-label={isScrolling ? "Pause auto-scroll" : "Play auto-scroll"}
        >
          {isScrolling ? <FaPause /> : <FaPlay />}
        </button>

        <div className={styles.speedDisplay}>
          <label className={styles.speedLabel}>per line</label>
          <span>{interval}s</span>
        </div>

        <button
          className={styles.speedButton}
          onClick={() => handleScrollIntervalChange("increase")}
          disabled={interval >= 10}
          aria-label='Increase scroll speed'
        >
          <FaPlus />
        </button>
      </div>
    </div>
  );
}
