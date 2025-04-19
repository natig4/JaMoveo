import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../hooks/redux-hooks";
import LoadingPage from "./Loading/Loading";

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
      navigate(!user?.groupId || !user?.instrument ? "/user" : "/");
    }
  }, [isAuthenticated, navigate, user?.groupId, user?.instrument]);

  if (loading && !initialized) {
    return <LoadingPage />;
  }

  return !isAuthenticated ? <>{children}</> : null;
}

export default AuthRedirect;
