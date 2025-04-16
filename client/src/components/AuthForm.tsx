import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

interface AuthFormProps {
  formType: "signin" | "signup";
  onSubmit: (
    username: string,
    password: string,
    instrument?: string
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

function AuthForm({ formType, onSubmit, isLoading, error }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [instrument, setInstrument] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isSignup = formType === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isSignup) {
        await onSubmit(username, password, instrument);
      } else {
        await onSubmit(username, password);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className='auth-container'>
      <div className='auth-content'>
        <div className='auth-header'>
          <Logo />
          <h2>Welcome to JaMoveo</h2>
          <h1>{isSignup ? "Register" : "Log In"}</h1>
        </div>

        {error && <div className='error-message'>{error}</div>}

        <form onSubmit={handleSubmit} className='auth-form'>
          <div className='form-group'>
            <label htmlFor='username'>
              {isSignup ? "Username*" : "Enter your Username*"}
            </label>
            <input
              type='text'
              id='username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isSignup ? "Select your username" : "Username"}
              required
              className='form-control'
            />
          </div>

          {isSignup && (
            <div className='form-group'>
              <label htmlFor='instrument'>Your instrument*</label>
              <div className='select-wrapper'>
                <select
                  id='instrument'
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  required
                  className='form-control'
                >
                  <option value='' disabled>
                    Select your instrument
                  </option>
                  <option value='guitar'>Guitar</option>
                  <option value='piano'>Piano</option>
                  <option value='drums'>Drums</option>
                  <option value='bass'>Bass</option>
                  <option value='saxophone'>Saxophone</option>
                  <option value='vocals'>Vocals</option>
                  <option value='other'>Other</option>
                </select>
              </div>
            </div>
          )}

          <div className='form-group'>
            <label htmlFor='password'>
              {isSignup ? "Create password*" : "Enter your Password*"}
            </label>
            <div className='password-input'>
              <input
                type={showPassword ? "text" : "password"}
                id='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "Your Password" : "Password"}
                required
                className='form-control'
              />
              <button
                type='button'
                className='toggle-password'
                onClick={toggleShowPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <span className='eye-icon'>👁️</span>
                ) : (
                  <span className='eye-icon'>👁️‍🗨️</span>
                )}
              </button>
            </div>
          </div>

          {!isSignup && (
            <div className='form-options'>
              <div className='remember-me'>
                <input type='checkbox' id='remember-me' />
                <label htmlFor='remember-me'>Remember me</label>
              </div>
              <Link to='/forgot-password' className='forgot-password'>
                Forgot Password?
              </Link>
            </div>
          )}

          <button type='submit' className='auth-button' disabled={isLoading}>
            {isLoading ? "Loading..." : isSignup ? "Register" : "Log In"}
          </button>
        </form>

        <div className='auth-alt-action'>
          {isSignup ? (
            <>
              Already have an account? <Link to='/signin'>Log In</Link>
            </>
          ) : (
            <>
              Don't have an account? <Link to='/signup'>Register</Link>
            </>
          )}
        </div>
      </div>
      <div className='auth-image'></div>
    </div>
  );
}

export default AuthForm;
