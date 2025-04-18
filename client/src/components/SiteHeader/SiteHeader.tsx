import { Link } from "react-router-dom";
import { useAppSelector } from "../../hooks/redux-hooks";

import styles from "./SiteHeader.module.scss";
import Logo from "../Logo/Logo";
import Avatar from "../Avatar/Avatar";

function SiteHeader() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header className={styles.header}>
      <Link to='/'>
        <Logo color='#FFCD29' className={`${styles.logo} bebas-neue-regular`} />
      </Link>
      <Link to='/user'>
        <Avatar imageUrl={user?.imageUrl} alt={user?.username} />
      </Link>
    </header>
  );
}

export default SiteHeader;
