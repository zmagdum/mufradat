/**
 * Dashboard Screen
 * Main screen after login - displays user progress and statistics
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ProgressDashboard } from './dashboard/ProgressDashboard';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
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
      <View style={styles.dashboardContent}>
        <ProgressDashboard />
      </View>
      <View style={styles.logoutContainer}>
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
  dashboardContent: {
    flex: 1,
  },
  logoutContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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
});

