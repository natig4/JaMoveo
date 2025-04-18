import { FaPlay, FaPause, FaPlus, FaMinus } from "react-icons/fa";
import styles from "./ScrollManager.module.scss";

interface ScrollManagerProps {
  isRtl: boolean;
  interval: number;
  isScrolling: boolean;
  toggleIsScrolling: () => void;
  handleScrollIntervalChange: (action: "increase" | "decrease") => void;
}

export default function ScrollManager({
  isRtl,
  interval,
  isScrolling,
  toggleIsScrolling,
  handleScrollIntervalChange,
}: ScrollManagerProps) {
  const increaseSpeed = () => {
    handleScrollIntervalChange("increase");
  };

  const decreaseSpeed = () => {
    handleScrollIntervalChange("decrease");
  };

  return (
    <div className={`${styles.controlsContainer} ${isRtl ? styles.rtl : ""}`}>
      <div className={styles.speedControls}>
        <button
          className={styles.speedButton}
          onClick={decreaseSpeed}
          disabled={interval <= 0.5}
          aria-label='Decrease scroll speed'
        >
          <FaMinus />
        </button>

        <button
          className={`${styles.controlButton} ${
            isScrolling ? styles.active : ""
          }`}
          onClick={toggleIsScrolling}
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
          onClick={increaseSpeed}
          disabled={interval >= 10}
          aria-label='Increase scroll speed'
        >
          <FaPlus />
        </button>
      </div>
    </div>
  );
}
