import React from "react";

import styles from "./ProfileFormContent.module.scss";
import {
  FormTab,
  setActiveTab,
  setInstrument,
  setGroupName,
  setNewGroupName,
  updateInstrument,
  updateGroup,
  createGroup,
  setCompletedInstrument,
} from "../../store/profile-forms-slice";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { UserRole } from "../../model/types";
import Input from "../Input/Input";
import InstrumentSelect from "../InstrumentSelect";
import StyledButton from "../StyledButton/StyledButton";
import { useSocket } from "../../hooks/useSocket";

interface ProfileFormContentProps {
  variant: "profile" | "onboarding";
  className?: {
    form?: string;
    errorMessage?: string;
    successMessage?: string;
    submitButton?: string;
    loadingMessage?: string;
    infoBox?: string;
    backButton?: string;
  };
  onBack?: () => void;
}

const ProfileFormContent: React.FC<ProfileFormContentProps> = ({
  variant,
  className = {},
  onBack,
}) => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const {
    activeTab,
    instrument,
    groupName,
    newGroupName,
    isCheckingGroup,
    isCheckingNewGroup,
    newGroupExists,
    groupNameError,
    successMessage,
  } = useAppSelector((state) => state.profileForms);

  const { reconnect } = useSocket();

  const isAdmin = user?.role === UserRole.ADMIN;
  const isOnboarding = variant === "onboarding";

  const submitInstrumentData = () => {
    if (user && instrument && instrument !== user.instrument) {
      dispatch(updateInstrument({ userId: user.id, instrument }));
      if (isOnboarding) {
        dispatch(setCompletedInstrument(true));
      }
    }
  };

  const submitGroupData = async () => {
    if (user && groupName !== user.groupName) {
      try {
        await dispatch(
          updateGroup({ userId: user.id, groupName: groupName || null })
        ).unwrap();

        await reconnect();
      } catch (error) {
        console.error("Error updating group:", error);
      }
    }
  };

  const submitNewGroupData = async () => {
    if (user && newGroupName && !newGroupExists) {
      try {
        await dispatch(createGroup({ groupName: newGroupName })).unwrap();

        await reconnect();
      } catch (error) {
        console.error("Error creating group:", error);
      }
    }
  };

  const handleTabChange = (tab: FormTab) => {
    if (isOnboarding) {
      if (activeTab === "instrument" && isValidInstrument) {
        submitInstrumentData();
      } else if (activeTab === "group" && groupName) {
        submitGroupData();
      } else if (
        activeTab === "createGroup" &&
        newGroupName &&
        !newGroupExists
      ) {
        submitNewGroupData();
      }
    }

    dispatch(setActiveTab(tab));
  };

  const handleInstrumentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    dispatch(setInstrument(e.target.value));
  };

  const handleGroupNameChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    dispatch(setGroupName(e.target.value));
  };

  const handleNewGroupNameChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    dispatch(setNewGroupName(e.target.value));
  };

  const handleInstrumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && instrument && instrument !== user.instrument) {
      dispatch(updateInstrument({ userId: user.id, instrument }));
      if (isOnboarding) {
        dispatch(setCompletedInstrument(true));
      }
    }
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && groupName !== user.groupName) {
      dispatch(updateGroup({ userId: user.id, groupName: groupName || null }));
    }
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && newGroupName && !newGroupExists) {
      dispatch(createGroup({ groupName: newGroupName }));
    }
  };

  const isValidInstrument = instrument.trim() !== "";
  const isGroupSubmitDisabled =
    loading || (isOnboarding && !groupName) || isCheckingGroup;
  const isNewGroupSubmitDisabled =
    loading || !newGroupName || newGroupExists || isCheckingNewGroup;

  return (
    <>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "instrument" ? styles.activeTab : ""
          }`}
          onClick={() => handleTabChange("instrument")}
        >
          Instrument
        </button>

        {!isAdmin && (
          <button
            className={`${styles.tab} ${
              activeTab === "group" ? styles.activeTab : ""
            }`}
            onClick={() => handleTabChange("group")}
          >
            Join Group
          </button>
        )}

        {!isAdmin && (
          <button
            className={`${styles.tab} ${
              activeTab === "createGroup" ? styles.activeTab : ""
            }`}
            onClick={() => handleTabChange("createGroup")}
          >
            Create Group
          </button>
        )}
      </div>

      {activeTab === "instrument" && (
        <form
          onSubmit={handleInstrumentSubmit}
          className={className.form || styles.form}
        >
          <InstrumentSelect
            value={instrument}
            onChange={handleInstrumentChange}
            required
            label={
              isOnboarding ? "Choose your instrument" : "Update your instrument"
            }
          />

          {error && (
            <p className={className.errorMessage || styles.errorMessage}>
              {error}
            </p>
          )}
          {successMessage && (
            <p className={className.successMessage || styles.successMessage}>
              {successMessage}
            </p>
          )}

          <StyledButton
            type='submit'
            disabled={loading || !isValidInstrument}
            className={className.submitButton || styles.submitButton}
          >
            {loading
              ? "Saving..."
              : isOnboarding && !groupName
              ? "Next"
              : "Update Instrument"}
          </StyledButton>
        </form>
      )}

      {activeTab === "group" && (
        <form
          onSubmit={handleGroupSubmit}
          className={className.form || styles.form}
        >
          <Input
            id='groupName'
            label={isOnboarding ? "Group name" : "Update your group"}
            type='text'
            value={groupName || ""}
            onChange={handleGroupNameChange}
            placeholder='Enter group name'
            required={isOnboarding}
            errorText='Group name must be at least 3 characters'
          />

          {isCheckingGroup && (
            <p className={className.loadingMessage || styles.loadingMessage}>
              Checking group name...
            </p>
          )}

          {user?.groupName && !isOnboarding && (
            <p className={styles.currentGroup}>
              Current group: <strong>{user.groupName}</strong>
            </p>
          )}

          {error && (
            <p className={className.errorMessage || styles.errorMessage}>
              {error}
            </p>
          )}
          {successMessage && (
            <p className={className.successMessage || styles.successMessage}>
              {successMessage}
            </p>
          )}

          <StyledButton
            type='submit'
            disabled={isGroupSubmitDisabled}
            className={className.submitButton || styles.submitButton}
          >
            {loading
              ? "Updating..."
              : isOnboarding
              ? "Join Group"
              : "Update Group"}
          </StyledButton>
        </form>
      )}

      {activeTab === "createGroup" && (
        <form
          onSubmit={handleCreateGroupSubmit}
          className={className.form || styles.form}
        >
          <Input
            id='newGroupName'
            label={isOnboarding ? "New group name" : "Create a new group"}
            type='text'
            value={newGroupName}
            onChange={handleNewGroupNameChange}
            placeholder={
              isOnboarding
                ? "Enter a unique group name"
                : "Enter your new group name"
            }
            required
            hasError={newGroupExists}
            errorText={
              groupNameError || "Group name must be at least 3 characters"
            }
          />

          {isCheckingNewGroup && (
            <p className={className.loadingMessage || styles.loadingMessage}>
              {isOnboarding
                ? "Checking availability..."
                : "Checking group name availability..."}
            </p>
          )}

          <div className={className.infoBox || styles.infoBox}>
            <p>
              {isOnboarding
                ? "Creating a new group will make you the admin, allowing you to:"
                : "Creating a new group will:"}
            </p>
            <ul>
              {<li>Make you the admin of the new group</li>}
              {user?.groupName && <li>Remove you from your current group</li>}
              <li>Allow you to control what songs are played</li>
              {<li>Allow you to manage the group's repertoire</li>}
            </ul>
          </div>

          {error && (
            <p className={className.errorMessage || styles.errorMessage}>
              {error}
            </p>
          )}
          {successMessage && (
            <p className={className.successMessage || styles.successMessage}>
              {successMessage}
            </p>
          )}

          <StyledButton
            type='submit'
            disabled={isNewGroupSubmitDisabled}
            className={className.submitButton || styles.submitButton}
          >
            {loading
              ? "Creating..."
              : isOnboarding
              ? "Create Group"
              : "Create Group & Become Admin"}
          </StyledButton>
        </form>
      )}

      {isOnboarding && activeTab !== "instrument" && onBack && (
        <button
          className={className.backButton || styles.backButton}
          onClick={onBack}
          disabled={loading}
        >
          Back to instrument selection
        </button>
      )}
    </>
  );
};

export default ProfileFormContent;
