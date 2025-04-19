import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux-hooks";
import { loginUser, clearError } from "../store/auth-slice";
import LoginSignupForm from "../components/AuthForm/LoginSignupForm";
import AuthFormShell from "../components/AuthFormShell/AuthFormShell";

function SigninPage() {
  const { loading, error } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (formData: {
    username: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    if (!formData.username.trim() || !formData.password.trim()) {
      return;
    }

    await dispatch(
      loginUser({
        username: formData.username,
        password: formData.password,
        rememberMe: formData.rememberMe,
      })
    );
  };

  return (
    <AuthFormShell isLogin title='Log in'>
      <LoginSignupForm
        formType='signin'
        onSubmit={handleSubmit}
        isLoading={loading}
        error={error}
      />
    </AuthFormShell>
  );
}

export default SigninPage;
