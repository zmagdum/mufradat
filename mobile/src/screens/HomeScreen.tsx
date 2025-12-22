/**
 * Home Screen
 * Main screen displaying user progress and statistics
 * (Previously DashboardScreen)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressDashboard } from './dashboard/ProgressDashboard';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ProgressDashboard />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
