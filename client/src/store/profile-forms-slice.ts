import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  updateUserProfile,
  updateUserGroup,
  createUserGroup,
  fetchCurrentUser,
} from "./auth-slice";

export type FormTab = "instrument" | "group" | "createGroup";

interface ProfileFormsState {
  activeTab: FormTab;
  instrument: string;
  groupName: string;
  newGroupName: string;
  isCheckingGroup: boolean;
  isCheckingNewGroup: boolean;
  newGroupExists: boolean;
  groupNameError: string | null;
  successMessage: string;
  onboardingCompleted: {
    instrument: boolean;
    group: boolean;
  };
}

const initialState: ProfileFormsState = {
  activeTab: "instrument",
  instrument: "",
  groupName: "",
  newGroupName: "",
  isCheckingGroup: false,
  isCheckingNewGroup: false,
  newGroupExists: false,
  groupNameError: null,
  successMessage: "",
  onboardingCompleted: {
    instrument: false,
    group: false,
  },
};

// Async actions
export const updateInstrument = createAsyncThunk(
  "profileForms/updateInstrument",
  async (
    { userId, instrument }: { userId: string; instrument: string },
    { dispatch }
  ) => {
    try {
      const updatedUser = await dispatch(
        updateUserProfile({
          userId,
          userData: { instrument },
        })
      ).unwrap();

      // After successful API call, forcefully fetch the current user to ensure state is updated
      await dispatch(fetchCurrentUser()).unwrap();

      dispatch(setCompletedInstrument(true));

      return updatedUser;
    } catch (error) {
      console.error("Failed to update instrument:", error);
      throw error;
    }
  }
);

export const updateGroup = createAsyncThunk(
  "profileForms/updateGroup",
  async (
    { userId, groupName }: { userId: string; groupName: string | null },
    { dispatch }
  ) => {
    const result = await dispatch(
      updateUserGroup({
        userId,
        groupName,
      })
    ).unwrap();

    await dispatch(fetchCurrentUser());
    dispatch(setCompletedGroup(true));
    return result;
  }
);

export const createGroup = createAsyncThunk(
  "profileForms/createGroup",
  async ({ groupName }: { groupName: string }, { dispatch }) => {
    const result = await dispatch(
      createUserGroup({
        groupName,
      })
    ).unwrap();

    await dispatch(fetchCurrentUser());
    dispatch(setCompletedGroup(true));
    dispatch(setActiveTab("instrument"));
    return result;
  }
);

const profileFormsSlice = createSlice({
  name: "profileForms",
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<FormTab>) {
      state.activeTab = action.payload;
      state.successMessage = "";
    },
    setInstrument(state, action: PayloadAction<string>) {
      state.instrument = action.payload;
    },
    setGroupName(state, action: PayloadAction<string>) {
      state.groupName = action.payload;
    },
    setNewGroupName(state, action: PayloadAction<string>) {
      state.newGroupName = action.payload;
    },
    setIsCheckingGroup(state, action: PayloadAction<boolean>) {
      state.isCheckingGroup = action.payload;
    },
    setIsCheckingNewGroup(state, action: PayloadAction<boolean>) {
      state.isCheckingNewGroup = action.payload;
    },
    setNewGroupExists(state, action: PayloadAction<boolean>) {
      state.newGroupExists = action.payload;
    },
    setGroupNameError(state, action: PayloadAction<string | null>) {
      state.groupNameError = action.payload;
    },
    setSuccessMessage(state, action: PayloadAction<string>) {
      state.successMessage = action.payload;
    },
    clearSuccessMessage(state) {
      state.successMessage = "";
    },
    setCompletedInstrument(state, action: PayloadAction<boolean>) {
      state.onboardingCompleted.instrument = action.payload;
    },
    setCompletedGroup(state, action: PayloadAction<boolean>) {
      state.onboardingCompleted.group = action.payload;
    },
    syncFormWithUserData(
      state,
      action: PayloadAction<{
        instrument?: string;
        groupName?: string;
        groupId?: string;
      }>
    ) {
      const { instrument, groupName, groupId } = action.payload;

      if (instrument && instrument !== state.instrument) {
        state.instrument = instrument;
        state.onboardingCompleted.instrument = true;
      }

      if (groupName && groupName !== state.groupName) {
        state.groupName = groupName;
      }

      if (
        (groupId && !state.onboardingCompleted.group) ||
        (groupName && !state.onboardingCompleted.group)
      ) {
        state.onboardingCompleted.group = true;
      }
    },
    resetFormState: () => initialState,
  },
});

export const {
  setActiveTab,
  setInstrument,
  setGroupName,
  setNewGroupName,
  setIsCheckingGroup,
  setIsCheckingNewGroup,
  setNewGroupExists,
  setGroupNameError,
  setSuccessMessage,
  clearSuccessMessage,
  setCompletedInstrument,
  setCompletedGroup,
  syncFormWithUserData,
  resetFormState,
} = profileFormsSlice.actions;

export default profileFormsSlice.reducer;
