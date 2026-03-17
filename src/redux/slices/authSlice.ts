import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import authService from '@/services/authService';
import { LoginRequest, LoginResponse, SocialLoginRequest, User } from '@api/types/authTypes';

// STATE
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  agency_code: string | null;
}

export interface AuthError {
  message: string;
  statusCode?: number;
  code?: string;
  errors?: any;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  agency_code: null,
};

// ASYNC THUNKS
export const loginAsync = createAsyncThunk<LoginResponse, LoginRequest, { rejectValue: AuthError }>(
  'auth/login',
  async (loginData, { rejectWithValue }) => {
    try {
      return await authService.login(loginData);
    } catch (error: any) {
      return rejectWithValue({
        message: error.message,
        statusCode: error.apiStatusCode || error.statusCode,
        code: error.apiResponse?.code,
        errors: error.apiResponse?.errors,
      });
    }
  }
);

export const logoutAsync = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

export const refreshTokenAsync = createAsyncThunk<
  { accessToken: string; refreshToken?: string },
  { refreshToken: string },
  { rejectValue: AuthError }
>('auth/refreshToken', async ({ refreshToken }, { rejectWithValue }) => {
  try {
    const response = await authService.refreshToken(refreshToken);
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    };
  } catch (error: any) {
    return rejectWithValue({
      message: error.message || 'Token refresh failed',
      statusCode: error.apiStatusCode || error.statusCode,
    });
  }
});

export const verifyTokenAsync = createAsyncThunk<
  { accessToken: string; refreshToken?: string; user: User },
  { accessToken: string; refreshToken?: string },
  { rejectValue: AuthError }
>('auth/verifyToken', async (tokens, { rejectWithValue }) => {
  try {
    const user = await authService.getMe(tokens.accessToken);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    };
  } catch (error: any) {
    if (error.apiStatusCode === 401 && tokens.refreshToken) {
      try {
        const refreshResult = await authService.refreshToken(tokens.refreshToken);

        // Get user info with new token
        const user = await authService.getMe(refreshResult.access_token);

        return {
          accessToken: refreshResult.access_token,
          refreshToken: refreshResult.refresh_token,
          user,
        };
      } catch (refreshError: any) {
        return rejectWithValue({
          message: 'Session expired, please login again',
          statusCode: refreshError.apiStatusCode || refreshError.statusCode,
        });
      }
    }

    return rejectWithValue({
      message: error.message || 'Token verification failed',
      statusCode: error.apiStatusCode || error.statusCode,
    });
  }
});

export const checkAuthAsync = createAsyncThunk<
  { accessToken: string; refreshToken: string; user: User },
  void,
  { rejectValue: string }
>('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const { getAuthData } = await import('@utils/authStorage');
    const { accessToken, refreshToken, user } = await getAuthData();

    if (accessToken && user) {
      return { accessToken, refreshToken: refreshToken ?? '', user };
    }
    return rejectWithValue('No token found');
  } catch (error: any) {
    return rejectWithValue(error.message || 'Check auth failed');
  }
});

export const registerAsync = createAsyncThunk<
  LoginResponse,
  {
    email: string;
    password: string;
    confirm_password: string;
    name: string;
    phone: string;
    line_user_id?: string;
    avatar?: any;
    agency_code?: any;
  },
  { rejectValue: string }
>('auth/register', async (registerData, { rejectWithValue }) => {
  try {
    return await authService.register(registerData);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Registration failed');
  }
});

export const setAuthenticated = createAsyncThunk('auth/setAuthenticated', async (_) => {
  return true;
});

const setAuthSuccessState = (
  state: AuthState,
  payload: {
    accessToken: string;
    refreshToken?: string;
    user: User;
  }
) => {
  state.isLoading = false;
  state.isAuthenticated = true;
  state.user = payload.user;
  state.accessToken = payload.accessToken;
  state.refreshToken = payload.refreshToken ?? null;
  state.error = null;
};

export const socialLoginAsync = createAsyncThunk<
  LoginResponse,
  SocialLoginRequest,
  { rejectValue: AuthError }
>('auth/socialLogin', async (socialData, { rejectWithValue }) => {
  try {
    return await authService.socialLogin(socialData);
  } catch (error: any) {
    return rejectWithValue({
      message: error.message,
      statusCode: error.apiStatusCode || error.statusCode,
    });
  }
});

export const socialLineLoginAsync = createAsyncThunk<
  LoginResponse,
  SocialLoginRequest,
  { rejectValue: AuthError }
>('auth/socialLineLogin', async (socialData, { rejectWithValue }) => {
  try {
    return await authService.socialLineLogin(socialData);
  } catch (error: any) {
    return rejectWithValue({
      message: error.message,
      statusCode: error.apiStatusCode || error.statusCode,
    });
  }
});

// SLICE
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
  },
  extraReducers: (builder) => {
    // LOGIN
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        setAuthSuccessState(state, action.payload);
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.payload?.message || 'An error occurred';
      });

    // SOCIAL LOGIN
    builder
      .addCase(socialLoginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(socialLoginAsync.fulfilled, (state, action) => {
        setAuthSuccessState(state, action.payload);
      })
      .addCase(socialLoginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload?.message || 'Error occurred';
      });

    // SOCIAL LINE LOGIN
    builder
      .addCase(socialLineLoginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(socialLineLoginAsync.fulfilled, (state, action) => {
        setAuthSuccessState(state, action.payload);
      })
      .addCase(socialLineLoginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload?.message || 'Error occurred';
      });

    // LOGOUT
    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    });

    // REFRESH TOKEN
    builder
      .addCase(refreshTokenAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken ?? null;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(refreshTokenAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.payload?.message || 'An error occurred';
      });

    // CHECK AUTH
    builder
      .addCase(checkAuthAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthAsync.fulfilled, (state, action) => {
        setAuthSuccessState(state, action.payload);
      })
      .addCase(checkAuthAsync.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      });

    // VERIFY TOKEN (FaceID login)
    builder
      .addCase(verifyTokenAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyTokenAsync.fulfilled, (state, action) => {
        setAuthSuccessState(state, action.payload);
      })
      .addCase(verifyTokenAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.payload?.message || 'An error occurred';
      });

    // REGISTER
    builder
      .addCase(registerAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken ?? null;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder.addCase(setAuthenticated.fulfilled, (state) => {
      state.isAuthenticated = true;
    });
  },
});

export const { clearError, setUser, logout, setTokens } = authSlice.actions;
export default authSlice.reducer;
