import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/redux-hooks";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, initialized } = useAppSelector(
    (state) => state.auth
  );

  if (loading && !initialized) {
    return <div className='auth-loading'>Loading...</div>;
  }

  if (!isAuthenticated && initialized) {
    return <Navigate to='/signin' replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
