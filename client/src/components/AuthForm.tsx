import { useState } from "react";
import { Link } from "react-router-dom";

interface AuthFormProps {
  formType: "signin" | "signup" | "signup-admin";
  onSubmit: (
    username: string,
    password: string,
    email?: string,
    instrument?: string
  ) => void;
  isLoading: boolean;
  error: string | null;
  googleAuthUrl: string;
}

function AuthForm({
  formType,
  onSubmit,
  isLoading,
  error,
  googleAuthUrl,
}: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [instrument, setInstrument] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = formType === "signin";
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      onSubmit(username, password);
    } else {
      onSubmit(username, password, email, instrument);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className='auth-container'>
      <div className='auth-content'>
        <div className='auth-header'>
          <h2>Welcome to JaMoveo</h2>
          <h1>
            {isLogin
              ? "Log In"
              : formType === "signup-admin"
              ? "Admin Register"
              : "Register"}
          </h1>
        </div>

        {error && <div className='error'>{error}</div>}

        <form onSubmit={handleSubmit} className='auth-form'>
          <div className='form-group'>
            <label htmlFor='username'>Username*</label>
            <input
              type='text'
              id='username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={!isLogin ? "Select your username" : "Username"}
              required
            />
          </div>

          {!isLogin && (
            <div className='form-group'>
              <label htmlFor='email'>Email</label>
              <input
                type='email'
                id='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Your email address'
              />
            </div>
          )}

          {!isLogin && (
            <div className='form-group'>
              <label htmlFor='instrument'>Your instrument*</label>
              <div className='select-wrapper'>
                <select
                  id='instrument'
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  required
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
              {!isLogin ? "Create password*" : "Password*"}
            </label>
            <div className='password-input'>
              <input
                type={showPassword ? "text" : "password"}
                id='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Your Password'
                required
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

          <button type='submit' className='auth-button' disabled={isLoading}>
            {isLoading ? "Loading..." : !isLogin ? "Register" : "Sign In"}
          </button>

          <div className='auth-separator'>
            <span>OR</span>
          </div>

          <a href={googleAuthUrl} className='google-auth-button'>
            <span className='google-icon'>G</span>
            {!isLogin ? "Sign up with Google" : "Sign in with Google"}
          </a>
        </form>

        <div className='auth-alt-action'>
          {!isLogin ? (
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
