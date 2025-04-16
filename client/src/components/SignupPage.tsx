import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks/redux-hooks";
import { login } from "../store/auth-slice";
import AuthForm from "../components/AuthForm";
import * as authService from "../services/auth.service";

function SignupPage({ isAdmin }: { isAdmin: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  console.log("isAdmin", isAdmin);

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
      const data = {
        username,
        password,
        instrument,
      };

      const user = await (isAdmin
        ? authService.registerAdmin(data)
        : authService.register(data));

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
      formType={isAdmin ? "signup-admin" : "signup"}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
}

export default SignupPage;
