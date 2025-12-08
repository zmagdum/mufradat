/**
 * Phonetic Breakdown Component
 * Displays phonetic pronunciation of Arabic words
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PhoneticBreakdownProps {
  word: string;
  transliteration: string;
  syllables?: string[];
}

export const PhoneticBreakdown: React.FC<PhoneticBreakdownProps> = ({
  word,
  transliteration,
  syllables,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Phonetic Breakdown</Text>
      
      <View style={styles.wordContainer}>
        <Text style={styles.arabicWord}>{word}</Text>
        <Text style={styles.transliteration}>{transliteration}</Text>
      </View>

      {syllables && syllables.length > 0 && (
        <View style={styles.syllablesContainer}>
          <Text style={styles.syllablesLabel}>Syllables:</Text>
          <View style={styles.syllablesList}>
            {syllables.map((syllable, index) => (
              <View key={index} style={styles.syllableItem}>
                <Text style={styles.syllableText}>{syllable}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 10,
  },
  label: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  wordContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  arabicWord: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  transliteration: {
    fontSize: 18,
    color: '#3498db',
    fontStyle: 'italic',
  },
  syllablesContainer: {
    marginTop: 10,
  },
  syllablesLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  syllablesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  syllableItem: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syllableText: {
    fontSize: 16,
    color: '#34495e',
    fontWeight: '500',
  },
});

