import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks/redux-hooks";
import { login } from "../store/auth-slice";
import AuthForm from "../components/AuthForm";
import * as authService from "../services/auth.service";

function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (
    username: string,
    password: string,
    instrument?: string
  ) => {
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.register({
        username,
        password,
        instrument,
      });

      dispatch(login(user));
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sign up. Please try again."
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      formType='signup'
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
}

export default SignupPage;
