import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { logoutUser } from "../../store/auth-slice";
import { cleanState } from "../../store/songs-slice";
import styles from "./User.module.scss";
import StyledButton from "../../components/StyledButton/StyledButton";
import UserProfileForm from "../../components/UserProfileForm/UserProfileForm";
import { UserRole } from "../../model/types";
import { useSocket } from "../../hooks/useSocket";
import UserOnboardingPrompt from "../../components/UserOnboardingPrompt/UserOnboardingPrompt";

function User() {
  const { logout } = useSocket();
  const { user } = useAppSelector((state) => {
    return state.auth;
  });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    logout();
    dispatch(cleanState());
    await dispatch(logoutUser());
    navigate("/signin");
  };

  return (
    <>
      {(!user?.instrument || !user?.groupId) && (
        <UserOnboardingPrompt user={user} />
      )}

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Welcome {user?.username}!</h1>
          <p>
            Current instrument: <strong>{user?.instrument || "None"}</strong>
          </p>
          {user?.groupName ? (
            <p className={styles.groupInfo}>
              Current group: <strong>{user.groupName}</strong>
              {user.role === UserRole.ADMIN && (
                <span className={styles.adminBadge}>Admin</span>
              )}
            </p>
          ) : (
            <p className={styles.groupInfo}>No group joined</p>
          )}
        </div>

        <UserProfileForm />

        <div className={styles.logoutSection}>
          <StyledButton onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </StyledButton>
        </div>
      </div>
    </>
  );
}

export default User;
