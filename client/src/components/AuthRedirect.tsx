import { useEffect } from "react";
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

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (loading && !initialized) {
    return <div className='auth-loading'>Loading...</div>;
  }

  return !isAuthenticated ? <>{children}</> : null;
}

export default AuthRedirect;
