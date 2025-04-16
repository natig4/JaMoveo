import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

interface AuthFormProps {
  isSignup: boolean;
  onSubmit: (username: string, password: string, instrument?: string) => void;
  isLoading: boolean;
  error: string | null;
}

function AuthForm({ isSignup, onSubmit, isLoading, error }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [instrument, setInstrument] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      onSubmit(username, password, instrument);
    } else {
      onSubmit(username, password);
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
          <h1>{isSignup ? "Register" : "Sign In"}</h1>
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
              placeholder='Select your username'
              required
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
              {isSignup ? "Create password*" : "Password*"}
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
            {isLoading ? "Loading..." : isSignup ? "Register" : "Sign In"}
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
