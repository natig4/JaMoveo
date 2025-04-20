import { useState, useEffect, useCallback, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { searchSongs, setSearchQuery } from "../../store/songs-slice";
import styles from "./SearchSongs.module.scss";

const DEBOUNCE_DELAY = 500;

const SearchSongs: React.FC = () => {
  const dispatch = useAppDispatch();
  const { searchQuery, searchLoading } = useAppSelector((state) => state.songs);
  const [inputValue, setInputValue] = useState(searchQuery);
  const timeoutRef = useRef<number>(null);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        dispatch(setSearchQuery(query));
        dispatch(searchSongs(query));
      }, DEBOUNCE_DELAY);
    },
    [dispatch]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    debouncedSearch(query);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setSearchQuery(inputValue));
    dispatch(searchSongs(inputValue));
  };

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      dispatch(setSearchQuery(""));
    };
  }, [dispatch]);

  return (
    <form onSubmit={handleSubmit} className={styles.searchForm}>
      <div className={styles.searchContainer}>
        <input
          type='text'
          value={inputValue}
          onChange={handleInputChange}
          placeholder='Search any song...'
          className={styles.searchInput}
          aria-label='Search songs'
        />
        <button
          type='submit'
          className={styles.searchButton}
          aria-label='Search'
          disabled={searchLoading}
        >
          <FaSearch />
        </button>
      </div>
    </form>
  );
};

export default SearchSongs;
