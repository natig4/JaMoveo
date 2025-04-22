import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks/redux-hooks";

import {
  syncFormWithUserData,
  setActiveTab,
  resetFormState,
} from "../../store/profile-forms-slice";
import styles from "./UserOnboardingPrompt.module.scss";
import ProfileFormContent from "../ProfileFormContent/ProfileFormContent";
import { IUser } from "../../model/types";

function UserOnboardingPrompt({ user }: { user: IUser | null }) {
  const dispatch = useAppDispatch();
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

    if (onboardingCompleted.instrument && !onboardingCompleted.group) {
      dispatch(setActiveTab("group"));
    }

    return () => {
      dispatch(resetFormState());
    };
  }, [
    dispatch,
    user,
    onboardingCompleted.instrument,
    onboardingCompleted.group,
  ]);

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
