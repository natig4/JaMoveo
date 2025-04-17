import { Link } from "react-router-dom";
import { useAppSelector } from "../../hooks/redux-hooks";
// import { logoutUser } from "../../store/auth-slice";

import styles from "./SiteHeader.module.scss";
import Logo from "../Logo/Logo";
import Avatar from "../Avatar/Avatar";

function SiteHeader() {
  const { user } = useAppSelector((state) => state.auth);
  // const dispatch = useAppDispatch();
  // const navigate = useNavigate();

  // const handleLogout = async () => {
  //   await dispatch(logoutUser());
  //   navigate("/signin");
  // };

  return (
    <header className={styles.header}>
      <Link to='/'>
        <Logo color='#FFCD29' className={`${styles.logo} bebas-neue-regular`} />
      </Link>

      <Avatar imageUrl={user?.imageUrl} alt={user?.username} />
    </header>
  );
}

export default SiteHeader;
