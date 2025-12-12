/**
 * Registration Screen
 * Allows new users to create an account
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
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterScreenProps {
  navigation: any; // Replace with proper navigation type
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, isLoading, error, clearError } = useAuth();

  // Validate email format
  const validateEmail = (emailValue: string): string | undefined => {
    if (!emailValue.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  // Validate password requirements
  const validatePassword = (passwordValue: string): string | undefined => {
    if (!passwordValue) {
      return 'Password is required';
    }
    if (passwordValue.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(passwordValue)) {
      return 'Password must contain at least one capital letter';
    }
    if (!/[0-9]/.test(passwordValue)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordValue)) {
      return 'Password must contain at least one special character';
    }
    return undefined;
  };

  // Validate password match
  const validatePasswordMatch = (confirmPasswordValue: string): string | undefined => {
    if (!confirmPasswordValue) {
      return 'Please confirm your password';
    }
    if (confirmPasswordValue !== password) {
      return 'Passwords do not match';
    }
    return undefined;
  };

  // Update errors when fields change
  useEffect(() => {
    const newErrors: ValidationErrors = {};
    
    if (touched.email) {
      const emailError = validateEmail(email);
      if (emailError) newErrors.email = emailError;
    }
    
    if (touched.password) {
      const passwordError = validatePassword(password);
      if (passwordError) newErrors.password = passwordError;
    }
    
    if (touched.confirmPassword) {
      const confirmPasswordError = validatePasswordMatch(confirmPassword);
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    }
    
    setErrors(newErrors);
  }, [email, password, confirmPassword, touched]);

  // Handle server errors - ensure error is visible
  useEffect(() => {
    if (error) {
      // Error from Redux state - display it
      setServerError(error);
      console.log('🔴 Registration error in state:', error);
    } else {
      // Only clear server error if Redux error is cleared AND it was the same error
      // This prevents clearing errors that are still relevant
      if (serverError && !error) {
        // Error was cleared in Redux, but keep it visible for a bit
        // User can manually clear it or it will clear on next registration attempt
      }
    }
  }, [error]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setTouched(prev => ({ ...prev, email: true }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setTouched(prev => ({ ...prev, password: true }));
    // Also validate confirm password if it's been touched
    if (touched.confirmPassword) {
      setTouched(prev => ({ ...prev, confirmPassword: true }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setTouched(prev => ({ ...prev, confirmPassword: true }));
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validatePasswordMatch(confirmPassword);

    const newErrors: ValidationErrors = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    setTouched({ email: true, password: true, confirmPassword: true });

    return !emailError && !passwordError && !confirmPasswordError;
  };

  const handleRegister = async () => {
    // Clear any previous server errors
    clearError();
    setServerError(null);
    
    if (!validateForm()) {
      return;
    }

    try {
      console.log('🟢 Starting registration...');
      await register(email, password, username || undefined);
      console.log('🟢 Registration successful! Navigating to login...');
      
      // Registration successful - navigate to login with success message
      setServerError(null); // Clear any error on success
      clearError(); // Clear any Redux errors
      
      // Navigate to login screen with success message
      // Navigate immediately - don't wait for alert on web
      try {
        navigation.navigate('Login', { 
          message: 'Registration successful! Please login with your credentials.' 
        });
        console.log('🟢 Navigation to Login completed');
      } catch (navError) {
        console.error('❌ Navigation error:', navError);
        // Fallback: try without params
        navigation.navigate('Login');
      }
      
      // Show alert for native platforms only (web doesn't support Alert.alert well)
      // Use setTimeout to ensure navigation happens first
      if (Platform.OS !== 'web') {
        setTimeout(() => {
          Alert.alert(
            'Registration Successful',
            'Your account has been created successfully. Please login to continue.'
          );
        }, 100);
      }
    } catch (err: any) {
      // Error is stored in the auth context and will be displayed
      // Also set it locally to ensure it's visible
      const errorMessage = err?.message || 'Registration failed. Please try again.';
      setServerError(errorMessage);
      console.error('Registration failed:', err);
      // The error is also set in Redux state via register.rejected
      // But we set it locally too to ensure it's displayed
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Mufradat to start learning</Text>

          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                touched.email && errors.email && styles.inputError,
              ]}
              placeholder="Email *"
              value={email}
              onChangeText={handleEmailChange}
              onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
            {touched.email && errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="Username (optional)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!isLoading}
            />

            <TextInput
              style={[
                styles.input,
                touched.password && errors.password && styles.inputError,
              ]}
              placeholder="Password *"
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!isLoading}
            />
            {touched.password && errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <TextInput
              style={[
                styles.input,
                touched.confirmPassword && errors.confirmPassword && styles.inputError,
              ]}
              placeholder="Confirm Password *"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            <Text style={styles.hint}>
              Password must be at least 8 characters with one capital letter, one number, and one special character
            </Text>

            {(error || serverError) && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || serverError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={navigateToLogin}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
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
  hint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 10,
    marginTop: -10,
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  button: {
    backgroundColor: '#2ecc71',
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
});

