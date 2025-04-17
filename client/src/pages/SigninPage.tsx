import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/redux-hooks";
import { loginUser, clearError } from "../store/auth-slice";
import AuthForm from "../components/AuthForm";
import { getGoogleAuthUrl } from "../services/auth.service";

function SigninPage() {
  const { loading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );
  const [googleAuthUrl, setGoogleAuthUrl] = useState("");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }

    setGoogleAuthUrl(getGoogleAuthUrl());

    dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) {
      return;
    }

    await dispatch(loginUser({ username, password }));
  };

  return (
    <AuthForm
      formType='signin'
      onSubmit={handleSubmit}
      isLoading={loading}
      error={error}
      googleAuthUrl={googleAuthUrl}
    />
  );
}

export default SigninPage;
