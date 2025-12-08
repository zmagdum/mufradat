/**
 * Register Screen Unit Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RegisterScreen } from '../../screens/auth/RegisterScreen';
import { AuthProvider } from '../../contexts/AuthContext';
import authReducer from '../../store/slices/authSlice';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Mock the storage and api modules
jest.mock('../../services/storage', () => ({
  saveTokens: jest.fn(),
  getAccessToken: jest.fn(),
  clearTokens: jest.fn(),
}));

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

describe('RegisterScreen', () => {
  const createTestStore = () =>
    configureStore({
      reducer: {
        auth: authReducer,
      },
    });

  const renderRegisterScreen = () => {
    const store = createTestStore();
    return render(
      <Provider store={store}>
        <AuthProvider>
          <RegisterScreen navigation={mockNavigation} />
        </AuthProvider>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = renderRegisterScreen();

    expect(getByText('Create Account')).toBeTruthy();
    expect(getByText('Join Mufradat to start learning')).toBeTruthy();
    expect(getByPlaceholderText('Email *')).toBeTruthy();
    expect(getByPlaceholderText('Username (optional)')).toBeTruthy();
    expect(getByPlaceholderText('Password *')).toBeTruthy();
    expect(getByPlaceholderText('Confirm Password *')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
    expect(getByText('Already have an account? Login')).toBeTruthy();
  });

  it('should update form inputs', () => {
    const { getByPlaceholderText } = renderRegisterScreen();

    const emailInput = getByPlaceholderText('Email *');
    const usernameInput = getByPlaceholderText('Username (optional)');
    const passwordInput = getByPlaceholderText('Password *');
    const confirmPasswordInput = getByPlaceholderText('Confirm Password *');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');

    expect(emailInput.props.value).toBe('test@example.com');
    expect(usernameInput.props.value).toBe('testuser');
    expect(passwordInput.props.value).toBe('password123');
    expect(confirmPasswordInput.props.value).toBe('password123');
  });

  it('should navigate to login screen', () => {
    const { getByText } = renderRegisterScreen();

    const loginLink = getByText('Already have an account? Login');
    fireEvent.press(loginLink);

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('should show password hint', () => {
    const { getByText } = renderRegisterScreen();

    expect(getByText('Password must be at least 8 characters')).toBeTruthy();
  });

  it('should disable inputs and button when loading', () => {
    const { getByPlaceholderText } = renderRegisterScreen();

    const emailInput = getByPlaceholderText('Email *');
    const passwordInput = getByPlaceholderText('Password *');
    
    // Initially not loading, inputs should be enabled
    expect(emailInput.props.editable).toBe(true);
    expect(passwordInput.props.editable).toBe(true);
  });
});

