import { useState, useEffect, useRef } from "react";
import { ISong, SongLine } from "../../model/types";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { stopScrolling } from "../../store/songs-slice";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLineIndexRef = useRef(0);

  const dispatch = useAppDispatch();
  const { isScrolling, interval } = useAppSelector(
    (state) => state.songs.scrollSettings
  );

  useEffect(() => {
    let intervalId: number;
    if (isScrolling) {
      intervalId = setInterval(() => {
        setCurrentLineIndex((prevIndex) => {
          return (prevIndex + 1) % song.data.length;
        });
      }, interval * 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isScrolling, song.data.length, interval]);

  useEffect(() => {
    const isLastLine = currentLineIndex === 0 && isScrolling;

    if (isLastLine && prevLineIndexRef.current === song.data.length - 1) {
      dispatch(stopScrolling());
    }

    prevLineIndexRef.current = currentLineIndex;
  }, [currentLineIndex, isScrolling, song.data.length, dispatch]);

  useEffect(() => {
    if (scrollRef.current && isScrolling) {
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
  }, [currentLineIndex, isScrolling]);

  useEffect(() => {
    setCurrentLineIndex(0);
  }, [song.id]);

  useEffect(() => {
    const hasHebrewText =
      song.data.length > 0 && song.data[0].length > 0
        ? isHebrewText(song.data[0][0].lyrics)
        : false;
    setIsHebrew(hasHebrewText);
  }, [song.data]);

  const showChords = instrument !== "vocals";

  return (
    <div
      className={`${styles.playerContainer} ${isHebrew ? styles.rtlText : ""}`}
    >
      <div
        className={`${styles.header} ${
          isHebrewText(song.title) ? styles.rtl : ""
        }`}
      >
        <h1>{song.title}</h1>
        <h2>{song.artist}</h2>
      </div>

      <ScrollManager isRtl={isHebrew} />

      <div className={styles.lyricsContainer} ref={scrollRef}>
        {song.data.map((line: SongLine, lineIndex: number) => (
          <div
            key={`line-${lineIndex}`}
            className={`${styles.line} ${
              lineIndex === currentLineIndex && isScrolling
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
