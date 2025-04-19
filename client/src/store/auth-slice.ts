import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { IUser } from "../model/types";
import * as authService from "../services/auth.service";
import * as userService from "../services/users.service";
import * as groupService from "../services/groups.service";

interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  initialized: false,
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    {
      username,
      password,
      email,
      instrument,
      groupName,
    }: {
      username: string;
      password: string;
      email?: string;
      instrument?: string;
      groupName?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const user = await authService.register(
        username,
        password,
        email,
        instrument,
        groupName
      );
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Registration failed"
      );
    }
  }
);

export const registerAdminUser = createAsyncThunk(
  "auth/registerAdmin",
  async (
    {
      username,
      password,
      email,
      instrument,
      groupName,
    }: {
      username: string;
      password: string;
      email?: string;
      instrument?: string;
      groupName: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const user = await authService.registerAdmin(
        username,
        password,
        email,
        instrument,
        groupName
      );
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Admin registration failed"
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    {
      username,
      password,
      rememberMe = false,
    }: {
      username: string;
      password: string;
      rememberMe?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const user = await authService.login(username, password, rememberMe);
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed"
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Logout failed"
      );
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue, getState }) => {
    const state = getState() as { auth: AuthState };

    if (state.auth.initialized && !state.auth.isAuthenticated) {
      return null;
    }

    try {
      const user = await authService.getCurrentUser();
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch user"
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (
    {
      userId,
      userData,
    }: {
      userId: string;
      userData: Partial<IUser>;
    },
    { rejectWithValue }
  ) => {
    try {
      const updatedUser = await userService.updateUserProfile(userId, userData);
      return updatedUser;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  }
);

export const updateUserGroup = createAsyncThunk(
  "auth/updateGroup",
  async (
    {
      userId,
      groupName,
    }: {
      userId: string;
      groupName: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const updatedUser = await userService.updateUserGroup(userId, groupName);
      return updatedUser;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update group"
      );
    }
  }
);

export const createUserGroup = createAsyncThunk(
  "auth/createGroup",
  async (
    {
      groupName,
    }: {
      groupName: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const newGroup = await groupService.createNewGroup(groupName);
      return newGroup.user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create group"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register cases
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      registerUser.fulfilled,
      (state, action: PayloadAction<IUser>) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      }
    );
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Register Admin cases
    builder.addCase(registerAdminUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      registerAdminUser.fulfilled,
      (state, action: PayloadAction<IUser>) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      }
    );
    builder.addCase(registerAdminUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Login cases
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      loginUser.fulfilled,
      (state, action: PayloadAction<IUser>) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      }
    );
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Logout cases
    builder.addCase(logoutUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch current user cases
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      fetchCurrentUser.fulfilled,
      (state, action: PayloadAction<IUser | null>) => {
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      }
    );
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = action.payload as string;
      state.initialized = true;
    });

    // Profile update cases
    builder.addCase(updateUserProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateUserProfile.fulfilled,
      (state, action: PayloadAction<IUser>) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      }
    );
    builder.addCase(updateUserProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Group update cases
    builder.addCase(updateUserGroup.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateUserGroup.fulfilled,
      (state, action: PayloadAction<IUser>) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      }
    );
    builder.addCase(updateUserGroup.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create group cases
    builder.addCase(createUserGroup.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      createUserGroup.fulfilled,
      (state, action: PayloadAction<IUser>) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      }
    );
    builder.addCase(createUserGroup.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
