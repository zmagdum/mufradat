/**
 * Grammar Analysis Component
 * Displays grammatical analysis for Arabic words
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface GrammarAnalysisProps {
  word: string;
  analysis: {
    wordType: string;
    root?: string;
    pattern?: string;
    case?: string;
    number?: string;
    gender?: string;
    tense?: string;
    person?: string;
    notes?: string;
  };
}

export const GrammarAnalysis: React.FC<GrammarAnalysisProps> = ({
  word,
  analysis,
}) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.word}>{word}</Text>
        <Text style={styles.wordType}>{analysis.wordType}</Text>
      </View>

      <View style={styles.detailsContainer}>
        {analysis.root && (
          <DetailRow label="Root" value={analysis.root} />
        )}
        {analysis.pattern && (
          <DetailRow label="Pattern" value={analysis.pattern} />
        )}
        {analysis.case && (
          <DetailRow label="Case" value={analysis.case} />
        )}
        {analysis.number && (
          <DetailRow label="Number" value={analysis.number} />
        )}
        {analysis.gender && (
          <DetailRow label="Gender" value={analysis.gender} />
        )}
        {analysis.tense && (
          <DetailRow label="Tense" value={analysis.tense} />
        )}
        {analysis.person && (
          <DetailRow label="Person" value={analysis.person} />
        )}
      </View>

      {analysis.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notes}>{analysis.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    alignItems: 'center',
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  wordType: {
    fontSize: 16,
    color: '#ecf0f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailsContainer: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  detailValue: {
    flex: 2,
    fontSize: 16,
    color: '#2c3e50',
  },
  notesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    margin: 15,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
});

