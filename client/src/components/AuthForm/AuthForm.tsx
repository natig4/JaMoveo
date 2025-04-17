import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./AuthForm.module.scss";
import { useInput } from "../../hooks/useInput";
import Input from "../Input/Input";
import Logo from "../Logo/Logo";
import StyledButton from "../StyledButton/StyledButton";
import InstrumentSelect from "../InstrumentSelect";

interface AuthFormProps {
  formType: "signin" | "signup" | "signup-admin";
  onSubmit: (formData: {
    username: string;
    password: string;
    email?: string;
    instrument?: string;
    rememberMe?: boolean;
  }) => void;
  isLoading?: boolean;
  error?: string | null;
}

function AuthForm({
  formType,
  onSubmit,
  isLoading = false,
  error = null,
}: AuthFormProps) {
  // Input states with validation
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
    if (!value && formType === "signin") return true; // Email is optional for signin
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
  });

  const {
    value: instrument,
    handleInputChange: handleInstrumentChange,
    handleInputBlur: handleInstrumentBlur,
    hasError: instrumentHasError,
  } = useInput("", (value) => {
    if (formType === "signin") return true; // No instrument for signin
    return value.trim() !== "";
  });

  const {
    value: password,
    handleInputChange: handlePasswordChange,
    handleInputBlur: handlePasswordBlur,
    hasError: passwordHasError,
  } = useInput("", (value) => value.trim().length >= 6);

  // UI states
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

    onSubmit({
      username,
      password,
      ...(formType !== "signin" && { email, instrument }),
      rememberMe,
    });
  };

  const isLogin = formType === "signin";
  const isAdminSignup = formType === "signup-admin";

  const getHeaderTitle = () => {
    if (isLogin) return "Log in";
    if (isAdminSignup) return "Admin Register";
    return "Register";
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Logo color='#000' className={`${styles.logo} bebas-neue-regular`} />
        <div className={styles.header}>
          <h2>Welcome to JaMoveo</h2>
          <h1>{getHeaderTitle()}</h1>
        </div>

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
              (!isLogin && (emailHasError || instrumentHasError))
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
      </div>

      <div className={`${styles.image} ${isLogin ? styles.login : ""}`}>
        <Logo className={`${styles.logo} bebas-neue-regular`} />
      </div>
    </div>
  );
}

export default AuthForm;
