import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks/redux-hooks";

import {
  syncFormWithUserData,
  setActiveTab,
  setShowTabs,
  resetFormState,
} from "../../store/profile-forms-slice";
import styles from "./UserOnboardingPrompt.module.scss";
import ProfileFormContent from "../ProfileFormContent/ProfileFormContent";

function UserOnboardingPrompt() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { onboardingCompleted } = useAppSelector((state) => state.profileForms);

  useEffect(() => {
    if (user) {
      dispatch(
        syncFormWithUserData({
          instrument: user.instrument,
          groupName: user.groupName,
          groupId: user.groupId,
        })
      );
    }

    return () => {
      dispatch(resetFormState());
    };
  }, [dispatch, user]);

  useEffect(() => {
    if (onboardingCompleted.instrument && !onboardingCompleted.group) {
      dispatch(setActiveTab("group"));
      dispatch(setShowTabs(true));
    }
  }, [dispatch, onboardingCompleted.instrument, onboardingCompleted.group]);

  if (!user || (user.instrument && user.groupId)) {
    return null;
  }

  const handleBack = () => {
    dispatch(setActiveTab("instrument"));
  };

  return (
    <div className={styles.promptContainer}>
      <div className={styles.promptContent}>
        <h2>Welcome to JaMoveo!</h2>
        <ProfileFormContent variant='onboarding' onBack={handleBack} />
      </div>
    </div>
  );
}

export default UserOnboardingPrompt;
