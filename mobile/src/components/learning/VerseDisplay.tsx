/**
 * Quranic Verse Display Component
 * Displays verses with word highlighting and translations
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface VerseDisplayProps {
  verseReference: string;
  arabicText: string;
  translation: string;
  transliteration: string;
  highlightedWordIndex?: number;
  onWordPress?: (wordIndex: number, word: string) => void;
}

export const VerseDisplay: React.FC<VerseDisplayProps> = ({
  verseReference,
  arabicText,
  translation,
  transliteration,
  highlightedWordIndex,
  onWordPress,
}) => {
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(
    highlightedWordIndex ?? null
  );
  const [showTransliteration, setShowTransliteration] = useState(false);

  const words = arabicText.split(' ');

  const handleWordPress = (index: number, word: string) => {
    setSelectedWordIndex(index);
    onWordPress?.(index, word);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Verse Reference */}
      <View style={styles.referenceContainer}>
        <Text style={styles.reference}>{verseReference}</Text>
      </View>

      {/* Arabic Text with Word Highlighting */}
      <View style={styles.verseContainer}>
        <View style={styles.wordsContainer}>
          {words.map((word, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleWordPress(index, word)}
              style={[
                styles.wordWrapper,
                selectedWordIndex === index && styles.highlightedWord,
              ]}
            >
              <Text style={styles.arabicWord}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Toggle Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowTransliteration(!showTransliteration)}
        >
          <Text style={styles.toggleText}>
            {showTransliteration ? 'Hide' : 'Show'} Transliteration
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transliteration */}
      {showTransliteration && (
        <View style={styles.transliterationContainer}>
          <Text style={styles.transliteration}>{transliteration}</Text>
        </View>
      )}

      {/* Translation */}
      <View style={styles.translationContainer}>
        <Text style={styles.translationLabel}>Translation:</Text>
        <Text style={styles.translation}>{translation}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  referenceContainer: {
    backgroundColor: '#2c3e50',
    padding: 12,
    alignItems: 'center',
  },
  reference: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verseContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 10,
    borderRadius: 12,
    marginHorizontal: 15,
  },
  wordsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  wordWrapper: {
    padding: 8,
    margin: 2,
    borderRadius: 6,
  },
  highlightedWord: {
    backgroundColor: '#fff3cd',
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  arabicWord: {
    fontSize: 24,
    color: '#2c3e50',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  toggleButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  transliterationContainer: {
    backgroundColor: '#e8f4f8',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  transliteration: {
    fontSize: 16,
    color: '#2c3e50',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  translationContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 12,
  },
  translationLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '600',
  },
  translation: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
  },
});

