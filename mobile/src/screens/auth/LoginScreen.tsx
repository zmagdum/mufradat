/**
 * Login Screen
 * Allows users to log in to their account
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface LoginScreenProps {
  navigation: any; // Replace with proper navigation type
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if we have a success message from registration
    if (route?.params?.message) {
      setSuccessMessage(route.params.message);
      // Clear the message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [route?.params?.message]);

  // Navigate to dashboard when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🟢 User authenticated, navigating to Dashboard...');
      navigation.navigate('Dashboard');
    }
  }, [isAuthenticated, navigation]);

  // Clear errors when component mounts (e.g., after logout)
  useEffect(() => {
    // Clear any errors from previous logout attempts
    if (error && error.includes('Logout')) {
      clearError();
    }
  }, []);

  // Handle server errors - ensure error is visible
  useEffect(() => {
    if (error) {
      setServerError(error);
      console.log('🔴 Login error in state:', error);
    } else {
      // Clear local error when Redux error is cleared
      if (serverError && !error) {
        // Keep error visible until user tries again
      }
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email || !password) {
      setServerError('Please enter both email and password');
      return;
    }

    // Clear any previous errors
    clearError();
    setServerError(null);

    try {
      console.log('🟢 Starting login...');
      await login(email, password);
      console.log('🟢 Login successful!');
      // Navigation will happen via useEffect when isAuthenticated becomes true
    } catch (err: any) {
      // Error is stored in the auth context and will be displayed
      // Also set it locally to ensure it's visible
      const errorMessage = err?.message || 'Login failed. Please try again.';
      setServerError(errorMessage);
      console.error('Login failed:', err);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Mufradat</Text>
        <Text style={styles.subtitle}>Quranic Vocabulary Learning</Text>

        <View style={styles.form}>
          {successMessage && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}
          {(error || serverError) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error || serverError}</Text>
            </View>
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoading}
            returnKeyType="next"
            onSubmitEditing={() => {
              // Focus password field when email field is submitted
              // This is handled automatically by React Native
            }}
            blurOnSubmit={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            editable={!isLoading}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            blurOnSubmit={true}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={navigateToRegister}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>
              Don't have an account? Register
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#7f8c8d',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#2c3e50', // Text color for input fields
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#3498db',
    fontSize: 16,
  },
  successContainer: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  successText: {
    color: '#155724',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    textAlign: 'center',
  },
});

