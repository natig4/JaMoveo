import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../hooks/redux-hooks";

interface AuthRedirectProps {
  children: React.ReactNode;
}

function AuthRedirect({ children }: AuthRedirectProps) {
  const { isAuthenticated, loading, initialized, user } = useAppSelector(
    (state) => state.auth
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(!user?.groupId ? "/user" : "/");
    }
  }, [isAuthenticated, navigate, user?.groupId]);

  if (loading && !initialized) {
    return <div className='auth-loading'>Loading...</div>;
  }

  return !isAuthenticated ? <>{children}</> : null;
}

export default AuthRedirect;
