/**
 * Learn Screen
 * Screen for learning new vocabulary words
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LearnScreenProps {
  navigation: any;
}

export const LearnScreen: React.FC<LearnScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Learn</Text>
        <Text style={styles.subtitle}>Learn new vocabulary words</Text>
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

