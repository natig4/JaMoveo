import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks/redux-hooks";
import { login } from "../store/auth-slice";
import AuthForm from "../components/AuthForm";
import { User } from "../model/types";

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
      const user: User = {
        id: Math.floor(Math.random() * 1000),
        username: username,
        role: "user",
        instrument: instrument || "other",
      };

      dispatch(login(user));

      localStorage.setItem("user", JSON.stringify(user));

      navigate("/");
    } catch (err) {
      setError("Failed to sign up. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      isSignup={true}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
}

export default SignupPage;
