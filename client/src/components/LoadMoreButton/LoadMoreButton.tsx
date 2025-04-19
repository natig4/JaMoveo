import React from "react";
import { FaCloudDownloadAlt } from "react-icons/fa";
import styles from "./LoadMoreButton.module.scss";

interface LoadMoreButtonProps {
  onClick: () => void;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onClick,
  loading,
  hasMore,
  error,
}) => {
  if (!hasMore && !loading && !error) {
    return (
      <div className={styles.noMoreSongs}>
        <p>No more songs available</p>
      </div>
    );
  }

  return (
    <div className={styles.loadMoreContainer}>
      <button
        onClick={onClick}
        disabled={loading || !hasMore}
        className={styles.loadMoreButton}
      >
        {loading ? (
          <span className={styles.loading}>
            <span className={styles.loadingDot}></span>
            <span className={styles.loadingDot}></span>
            <span className={styles.loadingDot}></span>
          </span>
        ) : (
          <>
            <FaCloudDownloadAlt className={styles.icon} />
            <span>Load more songs</span>
          </>
        )}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default LoadMoreButton;
