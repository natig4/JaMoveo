import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/redux-hooks";
import { login } from "../store/auth-slice";
import { User } from "../model/types";

interface AuthRedirectProps {
  children: React.ReactNode;
}

function AuthRedirect({ children }: AuthRedirectProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Check if the user is already authenticated (from localStorage or Redux)
  useEffect(() => {
    // First, try to restore auth state from localStorage if not authenticated
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
    } else {
      navigate("/");
    }
  }, [dispatch, isAuthenticated, navigate]);

  return <>{!isAuthenticated && children}</>;
}

export default AuthRedirect;
