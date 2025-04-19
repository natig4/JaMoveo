import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./LoginSignupForm.module.scss";
import { useInput } from "../../hooks/useInput";
import { useGroupNameValidator } from "../../hooks/useGroupNameValidator";
import Input from "../Input/Input";
import StyledButton from "../StyledButton/StyledButton";
import InstrumentSelect from "../InstrumentSelect";
import GoogleSignInButton from "../GoogleSignInButton/GoogleSignInButton";

interface LoginSignupFormProps {
  formType: "signin" | "signup" | "signup-admin";
  onSubmit: (formData: {
    username: string;
    password: string;
    email?: string;
    instrument?: string;
    groupName?: string;
    rememberMe?: boolean;
  }) => void;
  isLoading?: boolean;
  error?: string | null;
}

function LoginSignupForm({
  formType,
  onSubmit,
  isLoading = false,
  error = null,
}: LoginSignupFormProps) {
  const {
    value: username,
    handleInputChange: handleUsernameChange,
    handleInputBlur: handleUsernameBlur,
    hasError: usernameHasError,
  } = useInput("", (value) => value.trim().length >= 3);

  const {
    value: email,
    handleInputChange: handleEmailChange,
    handleInputBlur: handleEmailBlur,
    hasError: emailHasError,
  } = useInput("", (value) => {
    if (!value && formType === "signin") return true;

    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
  });

  const {
    value: instrument,
    handleInputChange: handleInstrumentChange,
    handleInputBlur: handleInstrumentBlur,
    hasError: instrumentHasError,
  } = useInput("", (value) => {
    if (formType === "signin") return true;
    return value.trim() !== "";
  });

  const isAdminSignup = formType === "signup-admin";
  const isLogin = formType === "signin";

  const {
    value: groupName,
    handleInputChange: handleGroupChange,
    handleInputBlur: handleGroupBlur,
    hasError: groupNameHasError,
    isChecking,
    valueIsValid: groupNameIsValid,
    error: groupNameError,
  } = useGroupNameValidator("", isAdminSignup, true);

  const {
    value: password,
    handleInputChange: handlePasswordChange,
    handleInputBlur: handlePasswordBlur,
    hasError: passwordHasError,
  } = useInput("", (value) => value.trim().length >= 6);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(e.target.checked);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameHasError || passwordHasError) {
      return;
    }

    if (formType !== "signin" && (emailHasError || instrumentHasError)) {
      return;
    }

    if (
      isAdminSignup &&
      (groupNameHasError || !groupNameIsValid || groupName.trim().length < 3)
    ) {
      return;
    }

    onSubmit({
      username,
      password,
      ...(formType !== "signin" && { email, instrument }),
      ...(formType !== "signin" && { groupName: groupName || undefined }),
      rememberMe,
    });
  };

  return (
    <>
      <GoogleSignInButton isRegister={!isLogin} />
      <div className={styles.orDivider}>or</div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          id='username'
          label={isLogin ? "Enter your Username" : "Your name"}
          type='text'
          value={username}
          onChange={handleUsernameChange}
          onBlur={handleUsernameBlur}
          placeholder='Username'
          required
          hasError={usernameHasError}
          errorText='Username is required (min. 3 characters)'
        />

        {!isLogin && (
          <Input
            id='email'
            label='Your email address'
            type='email'
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            placeholder='your.email@example.com'
            hasError={emailHasError}
            errorText='Please enter a valid email address'
          />
        )}

        {!isLogin && (
          <InstrumentSelect
            value={instrument}
            onChange={handleInstrumentChange}
            onBlur={handleInstrumentBlur}
            required
            hasError={instrumentHasError}
          />
        )}

        {!isLogin && (
          <Input
            id='groupName'
            label={
              isAdminSignup ? "Create a new group" : "Join a group (optional)"
            }
            type='text'
            value={groupName}
            onChange={handleGroupChange}
            onBlur={handleGroupBlur}
            placeholder={
              isAdminSignup
                ? "Your new group name"
                : "Group name (you can change later)"
            }
            required={isAdminSignup}
            hasError={groupNameHasError}
            errorText={
              groupNameError ||
              (isAdminSignup
                ? "Group name is required (min. 3 characters) and must be unique"
                : "Group name must be at least 3 characters (or empty)")
            }
          />
        )}

        {isChecking && (
          <p className={styles.checkingMessage}>Checking group name...</p>
        )}

        <Input
          id='password'
          label={isLogin ? "Enter your Password" : "Create password"}
          type='password'
          value={password}
          onChange={handlePasswordChange}
          onBlur={handlePasswordBlur}
          placeholder='Your Password'
          required
          hasError={passwordHasError}
          errorText='Password must be at least 6 characters'
          showPassword={showPassword}
          onTogglePassword={togglePasswordVisibility}
        />

        {isLogin && (
          <div className={styles.formActions}>
            <div className={styles.rememberMe}>
              <input
                type='checkbox'
                id='rememberMe'
                checked={rememberMe}
                onChange={handleRememberMeChange}
              />
              <label htmlFor='rememberMe'>Remember me</label>
            </div>
            <Link to='/forgot-password' className={styles.forgotPassword}>
              Forgot Password ?
            </Link>
          </div>
        )}

        {error && <p className={styles.errorMessage}>{error}</p>}

        <StyledButton
          type='submit'
          disabled={
            isLoading ||
            usernameHasError ||
            passwordHasError ||
            (isAdminSignup &&
              (groupNameHasError ||
                !groupNameIsValid ||
                isChecking ||
                groupName.trim().length < 3)) ||
            (!isLogin && emailHasError) ||
            (!isLogin && instrumentHasError)
          }
        >
          {isLoading ? "Loading..." : isLogin ? "Log in" : "Register"}
        </StyledButton>
      </form>

      <div className={styles.authRedirect}>
        {isLogin ? (
          <>
            Don't have an account? <Link to='/signup'>Register</Link>
          </>
        ) : (
          <>
            Already have an account? <Link to='/signin'>Log In</Link>
          </>
        )}
      </div>
    </>
  );
}

export default LoginSignupForm;
