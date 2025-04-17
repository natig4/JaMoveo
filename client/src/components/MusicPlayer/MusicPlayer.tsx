import { useState, useEffect, useRef } from "react";
import { ISong, SongLine } from "../../model/types";
import styles from "./MusicPlayer.module.scss";

function isHebrewText(text: string): boolean {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}

interface MusicPlayerProps {
  song: ISong;
  instrument?: string;
}

export default function MusicPlayer({ song, instrument }: MusicPlayerProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);
  const [isHebrew, setIsHebrew] = useState(false);
  const [scrollInterval, setScrollInterval] = useState(5);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let intervalId: number;
    if (autoScroll && song.data.length > 5) {
      intervalId = window.setInterval(() => {
        setCurrentLineIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < song.data.length) {
            return nextIndex;
          } else {
            setAutoScroll(false);
            return prevIndex;
          }
        });
      }, scrollInterval * 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoScroll, song.data.length, scrollInterval]);

  // Scroll to the current line
  useEffect(() => {
    if (scrollRef.current && autoScroll) {
      const lineElements = scrollRef.current.querySelectorAll(
        `.${styles.line}`
      );
      if (lineElements[currentLineIndex]) {
        lineElements[currentLineIndex].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [currentLineIndex, autoScroll]);

  const toggleAutoScroll = () => {
    setAutoScroll((prev) => !prev);
    if (!autoScroll) {
      setCurrentLineIndex(0);
    }
  };

  const handleScrollIntervalChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setScrollInterval(Number(e.target.value));
  };

  useEffect(() => {
    const isHebrew =
      song.data.length > 0 && song.data[0].length > 0
        ? isHebrewText(song.data[0][0].lyrics)
        : false;
    setIsHebrew(isHebrew);

    return () => {};
  }, [song.data]);

  // Determine if chords should be shown based on instrument
  const showChords = instrument !== "vocals";

  return (
    <div
      className={`${styles.playerContainer} ${isHebrew ? styles.rtlText : ""}`}
    >
      <div className={styles.header}>
        <h1>{song.title}</h1>
        <h2>{song.artist}</h2>
      </div>

      <div className={styles.controlsContainer}>
        <div className={styles.controls}>
          <div className={styles.scrollControls}>
            <button
              className={`${styles.scrollButton} ${
                autoScroll ? styles.active : ""
              }`}
              onClick={toggleAutoScroll}
            >
              {autoScroll ? "Stop Auto-Scroll" : "Start Auto-Scroll"}
            </button>

            <div className={styles.scrollSpeedContainer}>
              <label htmlFor='scrollSpeed'>Scroll Speed (sec):</label>
              <input
                id='scrollSpeed'
                type='range'
                min='2'
                max='10'
                step='0.5'
                value={scrollInterval}
                onChange={handleScrollIntervalChange}
                disabled={!autoScroll}
              />
              <span>{scrollInterval}s</span>
            </div>
          </div>

          <div className={styles.instrumentInfo}>
            <span>Current Instrument: {instrument || "Not specified"}</span>
          </div>
        </div>
      </div>

      <div className={styles.lyricsContainer} ref={scrollRef}>
        {song.data.map((line: SongLine, lineIndex: number) => (
          <div
            key={`line-${lineIndex}`}
            className={`${styles.line} ${
              lineIndex === currentLineIndex && autoScroll
                ? styles.activeLine
                : ""
            }`}
          >
            {line.map((item, itemIndex) => (
              <span
                key={`item-${lineIndex}-${itemIndex}`}
                className={styles.wordContainer}
              >
                {showChords && item.chords && (
                  <span className={styles.chord}>{item.chords}</span>
                )}
                <span className={styles.lyric}>{item.lyrics}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
