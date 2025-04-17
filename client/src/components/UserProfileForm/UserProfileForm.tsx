import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { updateUserProfile } from "../../store/auth-slice";
import { useInput } from "../../hooks/useInput";
import StyledButton from "../StyledButton/StyledButton";
import styles from "./UserProfileForm.module.scss";
import InstrumentSelect from "../InstrumentSelect";

function UserProfileForm() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const [successMessage, setSuccessMessage] = useState("");

  const {
    value: instrument,
    handleInputChange: handleInstrumentChange,
    handleInputBlur: handleInstrumentBlur,
    hasError: instrumentHasError,
  } = useInput(user?.instrument || "", (value) => value.trim() !== "");

  useEffect(() => {
    if (error) {
      setSuccessMessage("");
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (instrumentHasError || !user) {
      return;
    }

    if (instrument === user.instrument) {
      return;
    }

    try {
      await dispatch(
        updateUserProfile({
          userId: user.id,
          userData: { instrument },
        })
      );
      setSuccessMessage("Your instrument has been updated successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      // eslint-disable-next-line no-empty
    } catch {}
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.formContainer}>
      <h2>Update Your Profile</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <InstrumentSelect
          value={instrument}
          onChange={handleInstrumentChange}
          onBlur={handleInstrumentBlur}
          required
          hasError={instrumentHasError}
          label='Update your instrument'
        />

        {error && <p className={styles.errorMessage}>{error}</p>}
        {successMessage && (
          <p className={styles.successMessage}>{successMessage}</p>
        )}

        <StyledButton
          type='submit'
          disabled={
            loading || instrumentHasError || instrument === user.instrument
          }
          className={styles.submitButton}
        >
          {loading ? "Updating..." : "Update Instrument"}
        </StyledButton>
      </form>
    </div>
  );
}

export default UserProfileForm;
