import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "@/services/authService";
import { authTokenStorage } from "@/lib/authTokens";
import type { User, LoginCredentials, RegisterCredentials } from "@/types/auth.types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

const getErrorMessage = (err: unknown, fallback: string) => {
  const error = err as { response?: { data?: { message?: string | string[] } } };
  const message = error.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  return message ?? fallback;
};

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    const accessToken = authTokenStorage.getAccessToken();
    const refreshToken = authTokenStorage.getRefreshToken();

    if (!accessToken && !refreshToken) {
      return null;
    }

    try {
      return await authService.profile();
    } catch {
      if (!refreshToken) {
        authTokenStorage.clearTokens();
        return null;
      }

      try {
        const refreshed = await authService.refresh(refreshToken);
        authTokenStorage.setTokens({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
        });
        return await authService.profile();
      } catch (err: unknown) {
        authTokenStorage.clearTokens();
        return rejectWithValue(getErrorMessage(err, "Session expired. Please sign in again."));
      }
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      authTokenStorage.setTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      return data.user;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Login failed"));
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const data = await authService.register(credentials);
      authTokenStorage.setTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      return data.user;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Registration failed"));
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await authService.logout();
  } catch {
    // Logout should always complete client-side, even if the server token is already invalid.
  } finally {
    authTokenStorage.clearTokens();
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setUser(state, action: { payload: User }) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // initializeAuth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = action.payload;
        state.isAuthenticated = Boolean(action.payload);
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
