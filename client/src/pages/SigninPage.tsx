import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux-hooks";
import { loginUser, clearError } from "../store/auth-slice";
import AuthForm from "../components/AuthForm/AuthForm";
import { getGoogleAuthUrl } from "../services/auth.service";

function SigninPage() {
  const { loading, error } = useAppSelector((state) => state.auth);
  const [googleAuthUrl, setGoogleAuthUrl] = useState("");

  const dispatch = useAppDispatch();

  useEffect(() => {
    setGoogleAuthUrl(getGoogleAuthUrl());
    dispatch(clearError());
  }, [dispatch]);

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
