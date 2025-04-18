import styles from "./ScrollManager.module.scss";

interface IScrollProps {
  interval: number;
  isScrolling: boolean;
  toggleIsScrolling: () => void;
  handleScrollIntervalChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ScrollManager({
  interval,
  isScrolling,
  toggleIsScrolling,
  handleScrollIntervalChange,
}: IScrollProps) {
  return (
    <div className={styles.controlsContainer}>
      <div className={styles.controls}>
        <div className={styles.scrollControls}>
          <button
            className={`${styles.scrollButton} ${
              isScrolling ? styles.active : ""
            }`}
            onClick={toggleIsScrolling}
          >
            {isScrolling ? "Stop Auto-Scroll" : "Start Auto-Scroll"}
          </button>

          <div className={styles.scrollSpeedContainer}>
            <label htmlFor='scrollSpeed'>Scroll Speed (sec):</label>
            <input
              id='scrollSpeed'
              type='range'
              min='2'
              max='10'
              step='0.5'
              value={interval}
              onChange={handleScrollIntervalChange}
              disabled={!isScrolling}
            />
            <span>{interval}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
