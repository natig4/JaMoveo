import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { logoutUser } from "../../store/auth-slice";
import styles from "./User.module.scss";
import StyledButton from "../../components/StyledButton/StyledButton";

function User() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/signin");
  };
  return (
    <div className={styles.container}>
      <h1>Welcome {user?.username}!</h1>
      <StyledButton onClick={handleLogout}>Logout</StyledButton>
    </div>
  );
}

export default User;
