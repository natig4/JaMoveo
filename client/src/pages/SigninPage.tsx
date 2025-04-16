import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks/redux-hooks";
import { login } from "../store/auth-slice";
import AuthForm from "../components/AuthForm";
import { User } from "../model/types";

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
      // In a real app, this would authenticate against your backend
      // For now, we'll simulate authentication with hardcoded users
      let user: User;

      // Simulate checking against the two users from users.json
      if (username === "nati" && password === "1234") {
        user = {
          id: 1,
          username: "nati",
          role: "admin",
          instrument: "guitar",
        };
      } else if (username === "user" && password === "1234") {
        user = {
          id: 2,
          username: "user",
          role: "user",
          instrument: "piano",
        };
      } else {
        throw new Error("Invalid credentials");
      }

      dispatch(login(user));

      localStorage.setItem("user", JSON.stringify(user));

      navigate("/");
    } catch (err) {
      setError("Invalid username or password. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      isSignup={false}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
}

export default SigninPage;
