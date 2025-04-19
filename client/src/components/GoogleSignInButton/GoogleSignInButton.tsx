import { FcGoogle } from "react-icons/fc";
import styles from "./GoogleSignInButton.module.scss";
import { getGoogleAuthUrl } from "../../services/auth.service";

interface GoogleSignInButtonProps {
  className?: string;
  isRegister?: boolean;
}

function GoogleSignInButton({
  isRegister,
  className = "",
}: GoogleSignInButtonProps) {
  const handleGoogleSignIn = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <button
      type='button'
      onClick={handleGoogleSignIn}
      className={`${styles.googleButton} ${className}`}
    >
      <FcGoogle className={styles.googleIcon} />
      <span>{isRegister ? "Register" : "Sign in"} with Google</span>
    </button>
  );
}

export default GoogleSignInButton;
