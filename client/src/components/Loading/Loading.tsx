import styles from "./Loading.module.scss";

export default function LoadingPage({ text }: { text?: string }) {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.spinner}></div>
      <p>Loading{text ? ` ${text}` : ""}...</p>
    </div>
  );
}
