/**
 * Auth Context Unit Tests
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import authReducer from '../../store/slices/authSlice';

// Mock the storage module
jest.mock('../../services/storage', () => ({
  saveTokens: jest.fn(),
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
}));

// Mock the api module
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

describe('AuthContext', () => {
  const createTestStore = () =>
    configureStore({
      reducer: {
        auth: authReducer,
      },
    });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const store = createTestStore();
    return (
      <Provider store={store}>
        <AuthProvider>{children}</AuthProvider>
      </Provider>
    );
  };

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });

  it('should provide initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.isLoading).toBe(true); // Initially loading due to checkAuth
  });

  it('should provide auth methods', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should handle clearError', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    result.current.clearError();
    
    waitFor(() => {
      expect(result.current.error).toBe(null);
    });
  });
});

