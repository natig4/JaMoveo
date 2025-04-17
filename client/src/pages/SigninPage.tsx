import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux-hooks";
import { loginUser, clearError } from "../store/auth-slice";
import AuthForm from "../components/AuthForm/AuthForm";

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
    <AuthForm
      formType='signin'
      onSubmit={handleSubmit}
      isLoading={loading}
      error={error}
    />
  );
}

export default SigninPage;
