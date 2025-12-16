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
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { IslamicColors, IslamicGradients } from '../../constants/islamicTheme';

const { height } = Dimensions.get('window');

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
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={IslamicGradients.primary}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative Header Pattern */}
        <View style={styles.headerPattern}>
          <Text style={styles.patternText}>✦ ✧ ✦ ✧ ✦ ✧ ✦</Text>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo & Branding Section */}
            <View style={styles.brandingSection}>
              {/* Crescent Moon Icon */}
              <View style={styles.logoContainer}>
                <Text style={styles.crescentIcon}>☪</Text>
              </View>


              {/* Tagline */}
              <Text style={styles.tagline}>
                ✦ Learn the words of the Quran ✦
              </Text>
            </View>

            {/* Login Card */}
            <View style={styles.loginCard}>
              {/* Decorative Top Border */}
              <View style={styles.cardBorder} />

              <Text style={styles.welcomeText}>Assalamu Alaikum</Text>
              <Text style={styles.subtitleText}>
                Sign in to continue your learning journey
              </Text>

              {/* Success/Error Messages */}
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

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>✉</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="your@email.com"
                    placeholderTextColor={IslamicColors.lightGray}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isLoading}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor={IslamicColors.lightGray}
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
                </View>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[IslamicColors.emeraldGreen, IslamicColors.deepTeal]}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={IslamicColors.white} />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <Text style={styles.loginButtonIcon}>→</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>New to Mufradat? </Text>
                <TouchableOpacity onPress={navigateToRegister} disabled={isLoading}>
                  <Text style={styles.registerLink}>Create Account</Text>
                </TouchableOpacity>
              </View>

              {/* Decorative Bottom Border */}
              <View style={styles.cardBorderBottom} />
            </View>

            {/* Islamic Ornament Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerOrnament}>❁ ❃ ❁</Text>
              <Text style={styles.footerText}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    zIndex: 1,
  },
  patternText: {
    fontSize: 24,
    color: IslamicColors.gold,
    opacity: 0.6,
    letterSpacing: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },

  // Branding Section
  brandingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: IslamicColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  crescentIcon: {
    fontSize: 40,
    color: IslamicColors.deepTeal,
  },
  arabicTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: IslamicColors.white,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  englishTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: IslamicColors.lightGold,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 14,
    color: IslamicColors.white,
    opacity: 0.9,
    marginTop: 8,
    letterSpacing: 1,
  },

  // Login Card
  loginCard: {
    backgroundColor: IslamicColors.ivoryCream,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  cardBorder: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: IslamicColors.gold,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  cardBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 40,
    right: 40,
    height: 3,
    backgroundColor: IslamicColors.emeraldGreen,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    opacity: 0.5,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: IslamicColors.deepNavy,
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 8,
  },
  subtitleText: {
    fontSize: 15,
    color: IslamicColors.darkGray,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Input Styles
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: IslamicColors.deepNavy,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IslamicColors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: IslamicColors.softSand,
    paddingHorizontal: 16,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: IslamicColors.deepNavy,
  },
  passwordInput: {
    paddingRight: 16,
  },

  // Forgot Password
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: IslamicColors.emeraldGreen,
    fontWeight: '600',
  },

  // Login Button
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: IslamicColors.emeraldGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: IslamicColors.white,
    letterSpacing: 1,
  },
  loginButtonIcon: {
    fontSize: 20,
    color: IslamicColors.white,
    marginLeft: 8,
  },

  // Register
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: IslamicColors.darkGray,
  },
  registerLink: {
    fontSize: 15,
    color: IslamicColors.emeraldGreen,
    fontWeight: '700',
  },

  // Success/Error Messages
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

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerOrnament: {
    fontSize: 20,
    color: IslamicColors.gold,
    marginBottom: 8,
    letterSpacing: 8,
  },
  footerText: {
    fontSize: 16,
    color: IslamicColors.white,
    opacity: 0.9,
  },
});

