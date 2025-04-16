import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/redux-hooks";
import { logout } from "../store/auth-slice";

function Navbar() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("user");
    navigate("/signin");
  };

  return (
    <nav className='navbar'>
      <div className='logo'>
        <Link to='/'>JaMoveo</Link>
      </div>

      <div className='nav-links'>
        {isAuthenticated ? (
          <>
            <span className='welcome-text'>
              Welcome, {user?.username}!
              {user?.role === "admin" && (
                <span className='admin-badge'> (Admin)</span>
              )}
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to='/signup' className='nav-link'>
            Sign Up
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
