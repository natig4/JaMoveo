import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../hooks/redux-hooks";

interface AuthRedirectProps {
  children: React.ReactNode;
}

function AuthRedirect({ children }: AuthRedirectProps) {
  const { isAuthenticated, loading, initialized } = useAppSelector(
    (state) => state.auth
  );
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  if (loading && !initialized) {
    return <div className='auth-loading'>Loading...</div>;
  }

  return <>{children}</>;
}

export default AuthRedirect;
