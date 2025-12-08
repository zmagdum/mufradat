/**
 * Word Association Map Component
 * Displays related words and semantic connections
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface RelatedWord {
  wordId: string;
  arabicText: string;
  translation: string;
  relationshipType: 'synonym' | 'antonym' | 'derivative' | 'root' | 'related';
}

interface WordAssociationMapProps {
  centralWord: {
    arabicText: string;
    translation: string;
  };
  relatedWords: RelatedWord[];
  onWordPress?: (wordId: string) => void;
}

export const WordAssociationMap: React.FC<WordAssociationMapProps> = ({
  centralWord,
  relatedWords,
  onWordPress,
}) => {
  const groupedWords = groupByRelationship(relatedWords);

  return (
    <ScrollView style={styles.container}>
      {/* Central Word */}
      <View style={styles.centralWordContainer}>
        <Text style={styles.centralArabic}>{centralWord.arabicText}</Text>
        <Text style={styles.centralTranslation}>{centralWord.translation}</Text>
      </View>

      {/* Related Words by Category */}
      {Object.entries(groupedWords).map(([relationship, words]) => (
        <View key={relationship} style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>
            {formatRelationship(relationship)}
          </Text>
          <View style={styles.wordsGrid}>
            {words.map((word) => (
              <TouchableOpacity
                key={word.wordId}
                style={styles.wordCard}
                onPress={() => onWordPress?.(word.wordId)}
              >
                <Text style={styles.wordArabic}>{word.arabicText}</Text>
                <Text style={styles.wordTranslation}>{word.translation}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const groupByRelationship = (words: RelatedWord[]) => {
  return words.reduce((acc, word) => {
    const type = word.relationshipType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(word);
    return acc;
  }, {} as Record<string, RelatedWord[]>);
};

const formatRelationship = (type: string): string => {
  const labels: Record<string, string> = {
    synonym: 'Synonyms',
    antonym: 'Antonyms',
    derivative: 'Derivatives',
    root: 'From Same Root',
    related: 'Related Words',
  };
  return labels[type] || type;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centralWordContainer: {
    backgroundColor: '#3498db',
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  centralArabic: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  centralTranslation: {
    fontSize: 18,
    color: '#ecf0f1',
  },
  categoryContainer: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  wordCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  wordArabic: {
    fontSize: 20,
    color: '#2c3e50',
    fontWeight: '600',
    marginBottom: 4,
  },
  wordTranslation: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});

