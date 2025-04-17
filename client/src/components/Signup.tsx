import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/redux-hooks";
import { registerUser, clearError } from "../store/auth-slice";
import AuthForm from "./AuthForm/AuthForm";
import { getGoogleAuthUrl } from "../services/auth.service";

function SignupPage({ isAdmin }: { isAdmin: boolean }) {
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

  const handleSubmit = async (
    username: string,
    password: string,
    email?: string,
    instrument?: string
  ) => {
    if (!username.trim() || !password.trim()) {
      return;
    }

    await dispatch(registerUser({ username, password, email, instrument }));
  };

  return (
    <AuthForm
      formType={isAdmin ? "signup-admin" : "signup"}
      onSubmit={handleSubmit}
      isLoading={loading}
      error={error}
      googleAuthUrl={googleAuthUrl}
    />
  );
}

export default SignupPage;
