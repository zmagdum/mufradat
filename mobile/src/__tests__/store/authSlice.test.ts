/**
 * Auth Slice Unit Tests
 */

import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import authReducer, {
  login,
  register,
  logout,
  checkAuth,
  clearError,
  setTokens,
} from '../../store/slices/authSlice';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares as any);

describe('authSlice', () => {
  describe('reducers', () => {
    const initialState = {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };

    it('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle clearError', () => {
      const previousState = {
        ...initialState,
        error: 'Some error',
      };
      expect(authReducer(previousState, clearError())).toEqual(initialState);
    });

    it('should handle setTokens', () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      const nextState = authReducer(initialState, setTokens(tokens));
      expect(nextState.accessToken).toBe('access-token');
      expect(nextState.refreshToken).toBe('refresh-token');
    });
  });

  describe('async thunks', () => {
    it('should set isLoading to true when login is pending', () => {
      const action = { type: login.pending.type };
      const state = authReducer(undefined, action);
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should set isLoading to true when register is pending', () => {
      const action = { type: register.pending.type };
      const state = authReducer(undefined, action);
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle login fulfilled', () => {
      const payload = {
        user: { userId: '123', email: 'test@example.com' },
        token: 'jwt-token',
      };
      const action = { type: login.fulfilled.type, payload };
      const state = authReducer(undefined, action);
      
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(payload.user);
      expect(state.accessToken).toBe(payload.token);
      expect(state.error).toBe(null);
    });

    it('should handle register fulfilled', () => {
      const payload = {
        user: { userId: '123', email: 'test@example.com', username: 'testuser' },
        token: 'jwt-token',
      };
      const action = { type: register.fulfilled.type, payload };
      const state = authReducer(undefined, action);
      
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(payload.user);
      expect(state.accessToken).toBe(payload.token);
      expect(state.error).toBe(null);
    });

    it('should handle login rejected', () => {
      const action = {
        type: login.rejected.type,
        payload: 'Invalid credentials',
      };
      const state = authReducer(undefined, action);
      
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should handle logout fulfilled', () => {
      const authenticatedState = {
        user: { userId: '123', email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
      
      const action = { type: logout.fulfilled.type };
      const state = authReducer(authenticatedState, action);
      
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
    });

    it('should handle checkAuth fulfilled', () => {
      const payload = {
        user: { userId: '123', email: 'test@example.com' },
        token: 'jwt-token',
      };
      const action = { type: checkAuth.fulfilled.type, payload };
      const state = authReducer(undefined, action);
      
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(payload.user);
      expect(state.accessToken).toBe(payload.token);
    });

    it('should handle checkAuth rejected', () => {
      const authenticatedState = {
        user: { userId: '123', email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
      
      const action = { type: checkAuth.rejected.type };
      const state = authReducer(authenticatedState, action);
      
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
    });
  });
});

