import { ReactNode } from "react";
import Logo from "../Logo/Logo";
import styles from "./AuthFormShell.module.scss";

interface AuthFormShellProps {
  isLogin?: boolean;
  title: string;
  children: ReactNode;
}

function AuthFormShell({
  isLogin = false,
  title,
  children,
}: AuthFormShellProps) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Logo color='#000' className={`${styles.logo} bebas-neue-regular`} />
        <div className={styles.header}>
          <h2>Welcome to JaMoveo</h2>
          <h1>{title}</h1>
        </div>

        {children}
      </div>

      <div className={`${styles.image} ${isLogin ? styles.login : ""}`}>
        <Logo className={`${styles.logo} bebas-neue-regular`} />
      </div>
    </div>
  );
}

export default AuthFormShell;
