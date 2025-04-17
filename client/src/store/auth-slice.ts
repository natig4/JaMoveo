import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../model/types";
import * as authService from "../services/auth.service";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
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
    }: {
      username: string;
      password: string;
      email?: string;
      instrument?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const user = await authService.register(
        username,
        password,
        email,
        instrument
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
    }: {
      username: string;
      password: string;
      email?: string;
      instrument?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const user = await authService.registerAdmin(
        username,
        password,
        email,
        instrument
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
      (state, action: PayloadAction<User>) => {
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
      (state, action: PayloadAction<User>) => {
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
      (state, action: PayloadAction<User>) => {
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
      (state, action: PayloadAction<User | null>) => {
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
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
