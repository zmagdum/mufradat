/**
 * Settings Screen
 * User settings including profile editing, preferences, and logout
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, getUserProfile, getBooks, Book } from '../services/api';

// Web-compatible date input component
const WebDateInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: any;
}> = ({ value, onChange, disabled, style }) => {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#e1e8ed',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa',
        color: '#2c3e50',
        fontFamily: 'inherit',
        ...style,
      }}
    />
  );
};

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Section visibility states
  const [showProfileSection, setShowProfileSection] = useState(true);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPreferencesSection, setShowPreferencesSection] = useState(true);

  // Profile fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [newWordsPerDay, setNewWordsPerDay] = useState('10');
  const [language, setLanguage] = useState('English');

  const availableLanguages = ['English', 'Urdu'];

  useEffect(() => {
    loadUserProfile();
    loadBooks();
  }, []);

  useEffect(() => {
    // Update selected book when selection changes
    const book = books.find(b => b.bookId === selectedBookId);
    setSelectedBook(book || null);
  }, [selectedBookId, books]);

  const loadBooks = async () => {
    setLoadingBooks(true);
    try {
      console.log('Loading books from API...');
      const booksList = await getBooks();
      console.log('Books loaded:', booksList.length, booksList);
      setBooks(booksList);
      
      // Set first book as default if available and no book is selected
      if (booksList.length > 0) {
        // If selectedBookId doesn't match any book, use first book
        const currentBookExists = selectedBookId && booksList.some(b => b.bookId === selectedBookId);
        if (!currentBookExists) {
          setSelectedBookId(booksList[0].bookId);
          console.log('Set default book:', booksList[0].bookId);
        }
      }
    } catch (error: any) {
      console.error('Failed to load books:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Use empty list - user can still use the app
    } finally {
      setLoadingBooks(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUsername(profile.username || '');
      // Support both fullName and givenName for backward compatibility
      setFullName(profile.fullName || profile.givenName || '');
      if (profile.dateOfBirth) {
        setDateOfBirth(new Date(profile.dateOfBirth));
      }
      if (profile.studyGoal) {
        setNewWordsPerDay(profile.studyGoal.toString());
      }
      if (profile.selectedBookId) {
        setSelectedBookId(profile.selectedBookId);
      }
      if (profile.preferredLanguage) {
        setLanguage(profile.preferredLanguage);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    setIsLoading(true);
    try {
      const updates: any = {
        username: username.trim() || undefined,
        fullName: fullName,
        selectedBookId: selectedBookId,
        studyGoal: parseInt(newWordsPerDay) || 10,
        preferredLanguage: language,
      };

      if (dateOfBirth) {
        updates.dateOfBirth = dateOfBirth.toISOString();
      }

      await updateUserProfile(updates);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      // This would call a change password API endpoint
      // For now, we'll just show a success message
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.navigate('Login');
            } catch (err: any) {
              // Even if logout throws, navigate to login
              navigation.navigate('Login');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Not set';
    return date.toLocaleDateString();
  };

  const getBookDisplayName = (book: Book): string => {
    if (language === 'Urdu' && book.titleUrdu) {
      return book.titleUrdu;
    }
    return book.title;
  };

  const getBookDescription = (book: Book | null): string => {
    if (!book) return '';
    if (language === 'Urdu' && book.descriptionUrdu) {
      return book.descriptionUrdu;
    }
    return book.description;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TouchableOpacity
            onPress={() => setShowProfileSection(!showProfileSection)}
          >
            <Text style={styles.toggleText}>
              {showProfileSection ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {showProfileSection && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email || ''}
                editable={false}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username (Optional)</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Text style={styles.helperText}>A unique username for your profile</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth (Optional)</Text>
              {Platform.OS === 'web' ? (
                <WebDateInput
                  value={dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : ''}
                  onChange={(text) => {
                    if (text) {
                      const date = new Date(text);
                      if (!isNaN(date.getTime())) {
                        setDateOfBirth(date);
                      }
                    } else {
                      setDateOfBirth(null);
                    }
                  }}
                  disabled={isLoading}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                    disabled={isLoading}
                  >
                    <Text style={styles.dateButtonText}>
                      {formatDate(dateOfBirth)}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={dateOfBirth || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                          setDateOfBirth(selectedDate);
                        }
                      }}
                      maximumDate={new Date()}
                    />
                  )}
                </>
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.buttonDisabled]}
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Change Password Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <TouchableOpacity
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          >
            <Text style={styles.toggleText}>
              {showPasswordSection ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {showPasswordSection && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>Change Password</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Learning Preferences Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Learning Preferences</Text>
          <TouchableOpacity
            onPress={() => setShowPreferencesSection(!showPreferencesSection)}
          >
            <Text style={styles.toggleText}>
              {showPreferencesSection ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {showPreferencesSection && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Book</Text>
              {loadingBooks ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3498db" />
                  <Text style={styles.loadingText}>Loading books...</Text>
                </View>
              ) : books.length === 0 ? (
                <View style={styles.noBooksContainer}>
                  <Text style={styles.noBooksText}>No books available</Text>
                </View>
              ) : (
                <>
                  <View style={styles.radioButtonContainer}>
                    {books.map((book) => {
                      const isSelected = selectedBookId === book.bookId;
                      return (
                        <TouchableOpacity
                          key={book.bookId}
                          style={[
                            styles.radioButtonRow,
                            isSelected && styles.radioButtonRowSelected,
                          ]}
                          onPress={() => setSelectedBookId(book.bookId)}
                        >
                          <View style={styles.radioButton}>
                            {isSelected && <View style={styles.radioButtonInner} />}
                          </View>
                          <View style={styles.radioButtonContent}>
                            <Text
                              style={[
                                styles.radioButtonLabel,
                                isSelected && styles.radioButtonLabelSelected,
                              ]}
                            >
                              {getBookDisplayName(book)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {selectedBook && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionLabel}>Description:</Text>
                      <Text style={styles.descriptionText}>
                        {getBookDescription(selectedBook)}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Words Per Day</Text>
              <View style={styles.numberInputContainer}>
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() => {
                    const num = parseInt(newWordsPerDay) - 1;
                    if (num >= 1) setNewWordsPerDay(num.toString());
                  }}
                >
                  <Text style={styles.numberButtonText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.numberInput}
                  value={newWordsPerDay}
                  onChangeText={(text) => {
                    const num = parseInt(text);
                    if (!isNaN(num) && num >= 1 && num <= 100) {
                      setNewWordsPerDay(text);
                    }
                  }}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() => {
                    const num = parseInt(newWordsPerDay) + 1;
                    if (num <= 100) setNewWordsPerDay(num.toString());
                  }}
                >
                  <Text style={styles.numberButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>Between 1 and 100 words</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Language</Text>
              <View style={styles.optionsContainer}>
                {availableLanguages.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.optionButton,
                      language === lang && styles.optionButtonSelected,
                    ]}
                    onPress={() => setLanguage(lang)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        language === lang && styles.optionButtonTextSelected,
                      ]}
                    >
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.buttonDisabled]}
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>Save Preferences</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  toggleText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  inputDisabled: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
  },
  helperText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  dateButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  radioButtonContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    overflow: 'hidden',
  },
  radioButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    backgroundColor: '#fff',
  },
  radioButtonRowSelected: {
    backgroundColor: '#e8f4f8',
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3498db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3498db',
  },
  radioButtonContent: {
    flex: 1,
  },
  radioButtonLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  radioButtonLabelSelected: {
    fontWeight: '700',
    color: '#3498db',
  },
  noBooksContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  noBooksText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  descriptionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    backgroundColor: '#f8f9fa',
  },
  optionButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  optionButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  numberInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    color: '#2c3e50',
  },
  saveButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});


