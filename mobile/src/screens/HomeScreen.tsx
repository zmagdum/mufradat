/**
 * Home Screen
 * Main screen shown after successful authentication
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Clear any errors before navigating
      // Navigation will happen automatically when isAuthenticated becomes false
      navigation.navigate('Login');
    } catch (err: any) {
      // Even if logout throws, navigate to login
      // Tokens are cleared, so user is logged out
      console.warn('Logout completed (may have had API error):', err);
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Mufradat!</Text>
        <Text style={styles.subtitle}>Quranic Vocabulary Learning</Text>
        
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userText}>Logged in as: {user.email}</Text>
            {user.username && (
              <Text style={styles.userText}>Username: {user.username}</Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#7f8c8d',
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    width: '100%',
    maxWidth: 400,
  },
  userText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

