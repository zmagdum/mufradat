/**
 * Review Screen
 * Screen for reviewing vocabulary words
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ReviewScreenProps {
  navigation: any;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Review</Text>
        <Text style={styles.subtitle}>Review your vocabulary words</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});

