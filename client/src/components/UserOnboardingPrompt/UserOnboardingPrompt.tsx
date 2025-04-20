import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import {
  updateUserProfile,
  updateUserGroup,
  createUserGroup,
} from "../../store/auth-slice";
import { useInput } from "../../hooks/useInput";
import { useGroupNameValidator } from "../../hooks/useGroupNameValidator";
import InstrumentSelect from "../InstrumentSelect";
import StyledButton from "../StyledButton/StyledButton";
import Input from "../Input/Input";
import styles from "./UserOnboardingPrompt.module.scss";

function UserOnboardingPrompt() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeStep, setActiveStep] = useState<"instrument" | "group">(
    "instrument"
  );
  const [groupOption, setGroupOption] = useState<"join" | "create">("join");
  const [completed, setCompleted] = useState({
    instrument: false,
    group: false,
  });

  const {
    value: instrument,
    handleInputChange: handleInstrumentChange,
    handleInputBlur: handleInstrumentBlur,
    hasError: instrumentHasError,
    setValue: setInstrument,
  } = useInput(user?.instrument || "", (value) => value.trim() !== "");

  const {
    value: groupName,
    handleInputChange: handleGroupChange,
    handleInputBlur: handleGroupBlur,
    hasError: groupHasError,
    isChecking: isCheckingGroup,
    setValue: setGroupName,
  } = useGroupNameValidator(user?.groupName || "", false);

  const {
    value: newGroupName,
    handleInputChange: handleNewGroupChange,
    handleInputBlur: handleNewGroupBlur,
    hasError: newGroupHasError,
    isChecking: isCheckingNewGroup,
    isExists: newGroupExists,
    error: newGroupError,
  } = useGroupNameValidator("", true);

  useEffect(() => {
    if (user?.instrument) {
      setInstrument(user.instrument);
      setCompleted((prev) => ({ ...prev, instrument: true }));
    }

    if (user?.groupName) {
      setGroupName(user.groupName);
      setCompleted((prev) => ({ ...prev, group: true }));
    }
  }, [user?.instrument, user?.groupName, setInstrument, setGroupName]);

  useEffect(() => {
    if (completed.instrument && !completed.group) {
      setActiveStep("group");
    }
  }, [completed]);

  const handleInstrumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (instrumentHasError || !user || !instrument) {
      return;
    }

    try {
      await dispatch(
        updateUserProfile({
          userId: user.id,
          userData: { instrument },
        })
      ).unwrap();
      setSuccessMessage("Your instrument has been set successfully!");
      setCompleted((prev) => ({ ...prev, instrument: true }));
      setActiveStep("group");

      setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
    } catch (error) {
      console.error("Failed to set instrument:", error);
    }
  };

  const handleJoinGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (groupHasError || !user || !groupName) {
      return;
    }

    try {
      await dispatch(
        updateUserGroup({
          userId: user.id,
          groupName: groupName,
        })
      ).unwrap();
      setSuccessMessage("You've successfully joined the group!");
      setCompleted((prev) => ({ ...prev, group: true }));

      setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newGroupHasError || !user || !newGroupName || newGroupExists) {
      return;
    }

    try {
      await dispatch(
        createUserGroup({
          groupName: newGroupName,
        })
      ).unwrap();
      setSuccessMessage("Your new group has been created successfully!");
      setCompleted((prev) => ({ ...prev, group: true }));

      setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  // Skip rendering if user is fully onboarded or missing
  if (!user || (user.instrument && user.groupId)) {
    return null;
  }

  return (
    <div className={styles.promptContainer}>
      <div className={styles.promptContent}>
        <h2>Welcome to JaMoveo!</h2>

        {activeStep === "instrument" && (
          <>
            <p>Before you get started, please select your instrument:</p>
            <form onSubmit={handleInstrumentSubmit} className={styles.form}>
              <InstrumentSelect
                value={instrument}
                onChange={handleInstrumentChange}
                onBlur={handleInstrumentBlur}
                required
                hasError={instrumentHasError}
                label='Choose your instrument'
                className={styles.formField}
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
                {loading ? "Saving..." : "Next"}
              </StyledButton>
            </form>
          </>
        )}

        {activeStep === "group" && (
          <>
            <p>Now, let's get you connected with your band:</p>

            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${
                  groupOption === "join" ? styles.activeTab : ""
                }`}
                onClick={() => setGroupOption("join")}
              >
                Join Existing Group
              </button>
              <button
                className={`${styles.tab} ${
                  groupOption === "create" ? styles.activeTab : ""
                }`}
                onClick={() => setGroupOption("create")}
              >
                Create New Group
              </button>
            </div>

            {groupOption === "join" ? (
              <form onSubmit={handleJoinGroupSubmit} className={styles.form}>
                <Input
                  id='groupName'
                  label='Group name'
                  type='text'
                  value={groupName}
                  onChange={handleGroupChange}
                  onBlur={handleGroupBlur}
                  placeholder='Enter group name'
                  required
                  hasError={groupHasError}
                  errorText='Group name must be at least 3 characters'
                  className={styles.formField}
                />

                {isCheckingGroup && (
                  <p className={styles.loadingMessage}>
                    Checking group name...
                  </p>
                )}
                {error && <p className={styles.errorMessage}>{error}</p>}
                {successMessage && (
                  <p className={styles.successMessage}>{successMessage}</p>
                )}

                <StyledButton
                  type='submit'
                  disabled={
                    loading || groupHasError || !groupName || isCheckingGroup
                  }
                  className={styles.submitButton}
                >
                  {loading ? "Joining..." : "Join Group"}
                </StyledButton>
              </form>
            ) : (
              <form onSubmit={handleCreateGroupSubmit} className={styles.form}>
                <Input
                  id='newGroupName'
                  label='New group name'
                  type='text'
                  value={newGroupName}
                  onChange={handleNewGroupChange}
                  onBlur={handleNewGroupBlur}
                  placeholder='Enter a unique group name'
                  required
                  hasError={newGroupHasError || newGroupExists}
                  errorText={
                    newGroupError || "Group name must be at least 3 characters"
                  }
                  className={styles.formField}
                />

                {isCheckingNewGroup && (
                  <p className={styles.loadingMessage}>
                    Checking availability...
                  </p>
                )}

                <div className={styles.infoBox}>
                  <p>
                    Creating a new group will make you the admin, allowing you
                    to:
                  </p>
                  <ul>
                    <li>Control what songs are played</li>
                    <li>Manage the group's repertoire</li>
                  </ul>
                </div>

                {error && <p className={styles.errorMessage}>{error}</p>}
                {successMessage && (
                  <p className={styles.successMessage}>{successMessage}</p>
                )}

                <StyledButton
                  type='submit'
                  disabled={
                    loading ||
                    newGroupHasError ||
                    !newGroupName ||
                    isCheckingNewGroup ||
                    newGroupExists
                  }
                  className={styles.submitButton}
                >
                  {loading ? "Creating..." : "Create Group"}
                </StyledButton>
              </form>
            )}

            {activeStep === "group" && (
              <button
                className={styles.backButton}
                onClick={() => setActiveStep("instrument")}
                disabled={loading}
              >
                Back to instrument selection
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UserOnboardingPrompt;
