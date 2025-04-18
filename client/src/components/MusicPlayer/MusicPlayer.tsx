import { useState, useEffect, useRef } from "react";
import { ISong, SongLine } from "../../model/types";
import styles from "./MusicPlayer.module.scss";
import ScrollManager from "./ScrollManager/ScrollManager";

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
  const [isHebrew, setIsHebrew] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollInterval, setScrollInterval] = useState(5);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let intervalId: number;
    if (autoScroll) {
      intervalId = setInterval(() => {
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

  const showChords = instrument !== "vocals";

  return (
    <div
      className={`${styles.playerContainer} ${isHebrew ? styles.rtlText : ""}`}
    >
      <div className={styles.header}>
        <h1>{song.title}</h1>
        <h2>{song.artist}</h2>
      </div>

      <ScrollManager
        interval={scrollInterval}
        isScrolling={autoScroll}
        toggleIsScrolling={toggleAutoScroll}
        handleScrollIntervalChange={handleScrollIntervalChange}
      />

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
