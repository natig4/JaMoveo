import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { updateUserProfile } from "../../store/auth-slice";
import { useInput } from "../../hooks/useInput";
import InstrumentSelect from "../InstrumentSelect";
import StyledButton from "../StyledButton/StyledButton";
import styles from "./MissingInstrumentPrompt.module.scss";

function MissingInstrumentPrompt() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const [successMessage, setSuccessMessage] = useState("");

  const {
    value: instrument,
    handleInputChange: handleInstrumentChange,
    handleInputBlur: handleInstrumentBlur,
    hasError: instrumentHasError,
  } = useInput("", (value) => value.trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (instrumentHasError || !user) {
      return;
    }

    try {
      await dispatch(
        updateUserProfile({
          userId: user.id,
          userData: { instrument },
        })
      );
      setSuccessMessage("Your instrument has been set successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Failed to set instrument:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.promptContainer}>
      <div className={styles.promptContent}>
        <h2>Welcome to JaMoveo!</h2>
        <p>Before you get started, please select your instrument:</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <InstrumentSelect
            value={instrument}
            onChange={handleInstrumentChange}
            onBlur={handleInstrumentBlur}
            required
            hasError={instrumentHasError}
            label='Choose your instrument'
            className={styles.instrumentSelect}
          />

          {error && <p className={styles.errorMessage}>{error}</p>}
          {successMessage && (
            <p className={styles.successMessage}>{successMessage}</p>
          )}

          <StyledButton
            type='submit'
            disabled={loading || instrumentHasError || !instrument}
            className={styles.submitButton}
          >
            {loading ? "Saving..." : "Continue"}
          </StyledButton>
        </form>
      </div>
    </div>
  );
}

export default MissingInstrumentPrompt;
