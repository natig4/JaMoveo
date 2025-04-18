import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import {
  updateUserProfile,
  updateUserGroup,
  createUserGroup,
  fetchCurrentUser,
  clearError,
} from "../../store/auth-slice";
import { useInput } from "../../hooks/useInput";
import { useGroupNameValidator } from "../../hooks/useGroupNameValidator";
import StyledButton from "../StyledButton/StyledButton";
import styles from "./UserProfileForm.module.scss";
import InstrumentSelect from "../InstrumentSelect";
import { UserRole } from "../../model/types";
import Input from "../Input/Input";

function UserProfileForm() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "instrument" | "group" | "createGroup"
  >("instrument");

  const updateTab = (tab: "instrument" | "group" | "createGroup") => {
    setSuccessMessage("");
    dispatch(clearError());
    setActiveTab(tab);
  };

  const {
    value: instrument,
    handleInputChange: handleInstrumentChange,
    handleInputBlur: handleInstrumentBlur,
    hasError: instrumentHasError,
  } = useInput(user?.instrument || "", (value) => value.trim() !== "");

  const {
    value: groupName,
    handleInputChange: handleGroupChange,
    handleInputBlur: handleGroupBlur,
    hasError: groupHasError,
    isChecking,
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

  const handleInstrumentSubmit = async (e: React.FormEvent) => {
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

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (groupHasError || !user) {
      return;
    }

    if (groupName === user.groupName) {
      return;
    }

    try {
      await dispatch(
        updateUserGroup({
          userId: user.id,
          groupName: groupName || null,
        })
      ).unwrap();

      await dispatch(fetchCurrentUser());
      setSuccessMessage("Your group has been updated successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newGroupHasError || !user || newGroupExists) {
      return;
    }

    try {
      await dispatch(
        createUserGroup({
          groupName: newGroupName,
        })
      ).unwrap();

      await dispatch(fetchCurrentUser());
      setSuccessMessage(
        "Your new group has been created successfully! You are now an admin."
      );

      updateTab("instrument");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      // eslint-disable-next-line no-empty
    } catch {}
  };

  if (!user) {
    return null;
  }

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className={styles.formContainer}>
      <h2>Update Your Profile</h2>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "instrument" ? styles.activeTab : ""
          }`}
          onClick={() => updateTab("instrument")}
        >
          Instrument
        </button>
        {!isAdmin && (
          <button
            className={`${styles.tab} ${
              activeTab === "group" ? styles.activeTab : ""
            }`}
            onClick={() => {
              updateTab("group");
            }}
          >
            Join Group
          </button>
        )}
        {!isAdmin && (
          <button
            className={`${styles.tab} ${
              activeTab === "createGroup" ? styles.activeTab : ""
            }`}
            onClick={() => {
              updateTab("createGroup");
            }}
          >
            Create Group
          </button>
        )}
      </div>

      {activeTab === "instrument" ? (
        <form onSubmit={handleInstrumentSubmit} className={styles.form}>
          <InstrumentSelect
            value={instrument}
            onChange={(ev) => {
              if (error) {
                dispatch(clearError());
              }
              handleInstrumentChange(ev);
            }}
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
      ) : activeTab === "group" ? (
        <form onSubmit={handleGroupSubmit} className={styles.form}>
          <Input
            id='groupName'
            label='Update your group'
            type='text'
            value={groupName || ""}
            onChange={(ev) => {
              if (error) {
                dispatch(clearError());
              }
              handleGroupChange(ev);
            }}
            onBlur={handleGroupBlur}
            placeholder='Enter group name'
            hasError={groupHasError}
            errorText={"Group name must be at least 3 characters"}
            className={styles.groupSelect}
          />

          {isChecking && (
            <p className={styles.loadingMessage}>Checking group name...</p>
          )}
          {user.groupName && (
            <p className={styles.currentGroup}>
              Current group: <strong>{user.groupName}</strong>
            </p>
          )}

          {error && <p className={styles.errorMessage}>{error}</p>}
          {successMessage && (
            <p className={styles.successMessage}>{successMessage}</p>
          )}

          <StyledButton
            type='submit'
            disabled={
              loading ||
              groupHasError ||
              isChecking ||
              !groupName ||
              groupName === user.groupName
            }
            className={styles.submitButton}
          >
            {loading ? "Updating..." : "Update Group"}
          </StyledButton>
        </form>
      ) : (
        <form onSubmit={handleCreateGroupSubmit} className={styles.form}>
          <Input
            id='newGroupName'
            label='Create a new group'
            type='text'
            value={newGroupName}
            onChange={(ev) => {
              if (error) {
                dispatch(clearError());
              }
              handleNewGroupChange(ev);
            }}
            onBlur={handleNewGroupBlur}
            placeholder='Enter your new group name'
            hasError={newGroupHasError || newGroupExists}
            errorText={
              newGroupError || "Group name must be at least 3 characters"
            }
            className={styles.groupSelect}
          />

          {isCheckingNewGroup && (
            <p className={styles.loadingMessage}>
              Checking group name availability...
            </p>
          )}

          <div className={styles.createGroupInfo}>
            <p>Creating a new group will:</p>
            <ul>
              <li>Make you the admin of the new group</li>
              {user.groupName && <li>Remove you from your current group</li>}
              <li>Allow you to control what songs are played</li>
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
              isCheckingNewGroup ||
              newGroupExists ||
              !newGroupName
            }
            className={styles.submitButton}
          >
            {loading ? "Creating..." : "Create Group & Become Admin"}
          </StyledButton>
        </form>
      )}
    </div>
  );
}

export default UserProfileForm;
