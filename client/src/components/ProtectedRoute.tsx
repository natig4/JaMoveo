import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/redux-hooks";
import { fetchCurrentUser } from "../store/auth-slice";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isAuthenticated, loading]);

  if (loading) {
    return <div className='auth-loading'>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to='/signin' replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
