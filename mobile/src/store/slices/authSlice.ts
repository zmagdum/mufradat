/**
 * Authentication Redux Slice
 * Manages authentication state including user data, tokens, and loading states
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { saveTokens, clearTokens, getAccessToken, getRefreshToken } from '../../services/storage';
import api from '../../services/api';

interface User {
  userId: string;
  email: string;
  username?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks for authentication operations

export const register = createAsyncThunk(
  'auth/register',
  async (
    credentials: { email: string; password: string; username?: string },
    { rejectWithValue }
  ) => {
    try {
      // Backend returns: { success: true, data: { message, email, emailVerified } }
      const response = await api.post('/auth/register', {
        email: credentials.email,
        password: credentials.password,
        givenName: credentials.username,
      });

      // Check if response has the expected format
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.error?.message || 'Registration failed');
      }

      const { email, emailVerified } = response.data.data;
      
      // Registration successful - user needs to login after email verification
      // For now, return a temporary user object (user will need to login)
      const tempUserId = `temp-${Date.now()}`;
      
      return { 
        user: { userId: tempUserId, email, username: credentials.username }, 
        token: null, // No token yet - user needs to login
        emailVerified,
      };
    } catch (error: any) {
      // Extract error message from various response formats
      let errorMessage = 'Registration failed';
      
      if (error.response) {
        // Handle API response errors
        const data = error.response.data;
        if (data?.error?.message) {
          errorMessage = data.error.message;
        } else if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = typeof data.error === 'string' ? data.error : 'Registration failed';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid email or password format';
        } else if (error.response.status === 409) {
          errorMessage = 'An account with this email already exists';
        } else if (error.response.status === 403) {
          errorMessage = 'Registration is not allowed. Please check your credentials.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      // Backend returns: { success: true, data: { user: UserProfile, tokens: { accessToken, refreshToken } } }
      const response = await api.post('/auth/login', credentials);
      
      // Check if response has the expected format
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.error?.message || 'Login failed');
      }

      const { user, tokens } = response.data.data;
      
      // Save tokens securely
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      
      return { 
        user: { 
          userId: user.userId, 
          email: user.email, 
          username: user.username 
        }, 
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error: any) {
      // Extract error message from various response formats
      let errorMessage = 'Login failed';
      
      if (error.response) {
        const data = error.response.data;
        if (data?.error?.message) {
          errorMessage = data.error.message;
        } else if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = typeof data.error === 'string' ? data.error : 'Login failed';
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid email or password format';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Try to call logout API, but don't fail if it errors
      try {
        await api.post('/auth/logout');
      } catch (apiError: any) {
        // API call failed, but we'll still clear tokens locally
        // This is fine - logout should always succeed locally
        console.warn('Logout API call failed (this is OK):', apiError.message);
      }
      
      // Always clear tokens locally - logout succeeds even if API fails
      await clearTokens();
      return null;
    } catch (error: any) {
      // If token clearing fails, that's a real error
      console.error('Failed to clear tokens:', error);
      // Still try to clear tokens
      try {
        await clearTokens();
      } catch (clearError) {
        console.error('Critical: Could not clear tokens:', clearError);
      }
      // Don't set error - logout should always succeed if tokens are cleared
      return null;
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      
      if (!accessToken || !refreshToken) {
        return rejectWithValue('No token found');
      }
      
      // Verify token by fetching user profile
      // Backend returns: { success: true, data: UserProfile }
      const response = await api.get('/users/profile');
      
      if (!response.data?.success || !response.data?.data) {
        throw new Error('Invalid response format');
      }
      
      const user = response.data.data;
      
      return { 
        user: { 
          userId: user.userId, 
          email: user.email, 
          username: user.username 
        }, 
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      await clearTokens();
      return rejectWithValue('Authentication check failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        // Registration doesn't automatically log in - user needs to login
        // Only set authenticated if we have a token
        state.isAuthenticated = !!action.payload.token;
        state.user = action.payload.user;
        state.accessToken = action.payload.token;
        state.refreshToken = action.payload.token;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear any previous errors
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = null; // Clear error on successful logout
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        // Still clear auth state even if logout fails
        // Logout should always succeed locally (tokens cleared)
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = null; // Don't show error - logout succeeded locally
      });

    // Check Auth
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      });
  },
});

export const { clearError, setTokens } = authSlice.actions;
export default authSlice.reducer;

