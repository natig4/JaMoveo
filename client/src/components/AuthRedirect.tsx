import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/redux-hooks";
import { fetchCurrentUser } from "../store/auth-slice";

interface AuthRedirectProps {
  children: React.ReactNode;
}

function AuthRedirect({ children }: AuthRedirectProps) {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      dispatch(fetchCurrentUser());
    } else if (isAuthenticated) {
      navigate("/");
    }
  }, [dispatch, isAuthenticated, loading, navigate]);

  if (loading) {
    return <div className='auth-loading'>Loading...</div>;
  }

  return <>{!isAuthenticated && children}</>;
}

export default AuthRedirect;
