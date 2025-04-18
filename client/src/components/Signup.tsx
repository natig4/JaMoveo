import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/redux-hooks";
import {
  registerUser,
  registerAdminUser,
  clearError,
} from "../store/auth-slice";
import AuthForm from "./AuthForm/AuthForm";

function SignupPage({ isAdmin }: { isAdmin: boolean }) {
  const { loading, error, isAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (!isAdmin && (!user.groupId || !user.instrument)) {
        navigate("/user", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }

    dispatch(clearError());
  }, [isAuthenticated, user, navigate, dispatch, isAdmin]);

  const handleSubmit = async (formData: {
    username: string;
    password: string;
    email?: string;
    instrument?: string;
    groupName?: string;
  }) => {
    if (!formData.username.trim() || !formData.password.trim()) {
      return;
    }

    if (isAdmin && !formData.groupName?.trim()) {
      return;
    }

    const actionCreator = isAdmin ? registerAdminUser : registerUser;

    await dispatch(
      actionCreator({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        instrument: formData.instrument,
        groupName: formData.groupName!,
      })
    );
  };

  return (
    <AuthForm
      formType={isAdmin ? "signup-admin" : "signup"}
      onSubmit={handleSubmit}
      isLoading={loading}
      error={error}
    />
  );
}

export default SignupPage;
