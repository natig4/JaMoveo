import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/redux-hooks";
import { login } from "../store/auth-slice";
import { User } from "../model/types";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isAuthenticated) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as User;
          dispatch(login(user));
        } catch {
          localStorage.removeItem("user");
        }
      }
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to='/signin' replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
