import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks/redux-hooks";
import {
  syncFormWithUserData,
  resetFormState,
} from "../../store/profile-forms-slice";
import styles from "./UserProfileForm.module.scss";
import ProfileFormContent from "../ProfileFormContent/ProfileFormContent";

function UserProfileForm() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

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

  if (!user) {
    return null;
  }

  return (
    <div className={styles.formContainer}>
      <h2>Update Your Profile</h2>
      <ProfileFormContent variant='profile' />
    </div>
  );
}

export default UserProfileForm;
