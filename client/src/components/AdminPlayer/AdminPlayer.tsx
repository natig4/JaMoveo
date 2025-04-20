import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import {
  fetchSongs,
  loadMoreThenFetch,
  clearSongsErrors,
  setSearchQuery,
} from "../../store/songs-slice";
import SearchSongs from "../SearchSongs/SearchSongs";
import styles from "./AdminPlayer.module.scss";
import Song from "../Song/Song";
import LoadMoreButton from "../LoadMoreButton/LoadMoreButton";

export default function AdminPlayer() {
  const dispatch = useAppDispatch();
  const {
    filteredSongs,
    loading,
    searchLoading,
    loadMoreLoading,
    error,
    loadMoreError,
    searchQuery,
    hasMoreSongs,
    initialFetchDone,
  } = useAppSelector((state) => state.songs);

  useEffect(() => {
    dispatch(clearSongsErrors());
    dispatch(setSearchQuery(""));

    if (!initialFetchDone && !loading) {
      dispatch(fetchSongs());
    }
  }, [dispatch, initialFetchDone, loading]);

  const handleLoadMore = useCallback(() => {
    dispatch(loadMoreThenFetch());
  }, [dispatch]);

  if (loading && filteredSongs.length === 0 && !searchLoading) {
    return <div className={styles.loading}>Loading songs...</div>;
  }

  if (error && filteredSongs.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.adminSection}>
      <div className={styles.actions}>
        <SearchSongs />
        <LoadMoreButton
          onClick={handleLoadMore}
          loading={loadMoreLoading}
          hasMore={hasMoreSongs}
          error={loadMoreError}
        />
      </div>
      <div className={styles.header}>
        <h2>
          {searchQuery
            ? `Song that match: ${searchQuery}`
            : "Recommended song list"}
        </h2>
      </div>

      <div className={styles.songList}>
        {searchLoading && <div className={styles.searching}>Searching...</div>}

        {!searchLoading && filteredSongs.length === 0 && (
          <div className={styles.noResults}>No songs found</div>
        )}

        {filteredSongs.map((song) => (
          <Song key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}
