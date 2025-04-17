import { ChangeEvent } from "react";
import styles from "./Input.module.scss";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

type InputProps = {
  label: string;
  id: string;
  value: string;
  placeholder?: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur?: () => void;
  type?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  hasError?: boolean;
  errorText?: string;
  className?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
};

export default function Input({
  label,
  id,
  value,
  placeholder,
  onChange,
  onBlur,
  type = "text",
  required = false,
  options,
  hasError = false,
  errorText = "",
  className = "",
  showPassword = false,
  onTogglePassword,
  ...props
}: InputProps) {
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`${styles.label} ${required ? styles.required : ""}`}
      >
        {label}
      </label>

      {options ? (
        <div className={styles.selectContainer}>
          <select
            id={id}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className={`${styles.inputField} ${styles.selectField} ${
              hasError ? styles.hasError : ""
            }`}
            required={required}
            {...props}
          >
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : type === "checkbox" ? (
        <label className={styles.checkbox}>
          <input
            id={id}
            type='checkbox'
            checked={value === "true"}
            onChange={onChange}
            {...props}
          />
          {placeholder}
        </label>
      ) : type === "password" ? (
        <div className={styles.inputContainer}>
          <input
            id={id}
            type={inputType}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            className={`${styles.inputField} ${
              hasError ? styles.hasError : ""
            }`}
            required={required}
            {...props}
          />
          {onTogglePassword && (
            <button
              type='button'
              onClick={onTogglePassword}
              className={styles.passwordToggle}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
            </button>
          )}
        </div>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`${styles.inputField} ${hasError ? styles.hasError : ""}`}
          required={required}
          {...props}
        />
      )}

      {hasError && errorText && (
        <p className={styles.errorMessage}>{errorText}</p>
      )}
    </div>
  );
}
