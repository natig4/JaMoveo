import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks/redux-hooks";
import { login as loginAction } from "../store/auth-slice";
import AuthForm from "../components/AuthForm";
import * as authService from "../services/auth.service";

function SigninPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.login({ username, password });

      dispatch(loginAction(user));
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid username or password. Please try again."
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      formType='signin'
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
}

export default SigninPage;
