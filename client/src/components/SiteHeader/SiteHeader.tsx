import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks/redux-hooks";
import { logoutUser } from "../../store/auth-slice";

import styles from "./SiteHeader.module.scss";
import Logo from "../Logo/Logo";

function SiteHeader() {
  const { isAuthenticated, user, loading } = useAppSelector(
    (state) => state.auth
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/signin");
  };

  return (
    <header className={styles.header}>
      <Link to='/'>
        <Logo />
      </Link>

      <div className='nav-links'>
        {isAuthenticated && user ? (
          <>
            <span className='welcome-text'>
              Welcome, {user.username}!
              {user.role === "admin" && (
                <span className='admin-badge'> (Admin)</span>
              )}
            </span>
            <button onClick={handleLogout} disabled={loading}>
              {loading ? "Logging out..." : "Logout"}
            </button>
          </>
        ) : (
          <Link to='/signup' className='nav-link'>
            Sign Up
          </Link>
        )}
      </div>
    </header>
  );
}

export default SiteHeader;
