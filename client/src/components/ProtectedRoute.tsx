import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/redux-hooks";
import LoadingPage from "./Loading/Loading";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, initialized } = useAppSelector(
    (state) => state.auth
  );

  if (loading && !initialized) {
    return <LoadingPage />;
  }

  if (!isAuthenticated && initialized) {
    return <Navigate to='/signin' replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
