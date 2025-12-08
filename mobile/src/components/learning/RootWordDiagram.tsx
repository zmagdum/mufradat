/**
 * Root Word Diagram Component
 * Visualizes Arabic root letters and derived words
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ArabicTextDisplay } from './ArabicTextDisplay';

interface RootWordDiagramProps {
  rootLetters: string;
  derivedWords: Array<{
    word: string;
    meaning: string;
    form?: string;
  }>;
}

export const RootWordDiagram: React.FC<RootWordDiagramProps> = ({
  rootLetters,
  derivedWords,
}) => {
  return (
    <ScrollView style={styles.container}>
      {/* Root letters in center */}
      <View style={styles.rootContainer}>
        <Text style={styles.label}>Root</Text>
        <ArabicTextDisplay text={rootLetters} size="xlarge" color="#2c3e50" />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Derived words */}
      <View style={styles.derivedContainer}>
        <Text style={styles.sectionTitle}>Derived Words</Text>
        {derivedWords.map((item, index) => (
          <View key={index} style={styles.derivedItem}>
            <View style={styles.wordInfo}>
              <ArabicTextDisplay text={item.word} size="large" color="#3498db" />
              <Text style={styles.meaning}>{item.meaning}</Text>
              {item.form && <Text style={styles.form}>Form: {item.form}</Text>}
            </View>
            {/* Connection line */}
            {index < derivedWords.length - 1 && <View style={styles.connector} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  rootContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
    fontWeight: '600',
  },
  divider: {
    height: 2,
    backgroundColor: '#3498db',
    marginHorizontal: 40,
    marginVertical: 20,
  },
  derivedContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  derivedItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  wordInfo: {
    alignItems: 'center',
  },
  meaning: {
    fontSize: 16,
    color: '#34495e',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
    fontStyle: 'italic',
  },
  connector: {
    height: 20,
    width: 2,
    backgroundColor: '#bdc3c7',
    alignSelf: 'center',
    marginVertical: 5,
  },
});

