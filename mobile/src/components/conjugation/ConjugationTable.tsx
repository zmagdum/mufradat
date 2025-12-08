/**
 * Conjugation Table Component
 * Displays interactive Arabic verb conjugation table
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface ConjugationTableProps {
  verb: string;
  conjugations: {
    [tense: string]: {
      [person: string]: {
        [number: string]: {
          [gender: string]: string;
        };
      };
    };
  };
  onCellPress?: (tense: string, person: string, number: string, gender: string, form: string) => void;
}

export const ConjugationTable: React.FC<ConjugationTableProps> = ({
  verb,
  conjugations,
  onCellPress,
}) => {
  const [selectedTense, setSelectedTense] = useState('past');
  const tenses = Object.keys(conjugations);

  const renderTableCell = (
    person: string,
    number: string,
    gender: string,
    form: string
  ) => {
    return (
      <TouchableOpacity
        key={`${person}-${number}-${gender}`}
        style={styles.cell}
        onPress={() => onCellPress?.(selectedTense, person, number, gender, form)}
      >
        <Text style={styles.cellText}>{form}</Text>
      </TouchableOpacity>
    );
  };

  const renderConjugationGrid = () => {
    const tenseData = conjugations[selectedTense];
    if (!tenseData) return null;

    return (
      <View style={styles.grid}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>Person</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>Singular</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>Dual</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>Plural</Text>
          </View>
        </View>

        {/* Rows */}
        {['first', 'second', 'third'].map((person) => (
          <View key={person} style={styles.row}>
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>{formatPerson(person)}</Text>
            </View>

            {['singular', 'dual', 'plural'].map((number) => (
              <View key={number} style={styles.cellContainer}>
                {tenseData[person]?.[number] && (
                  <>
                    {renderTableCell(
                      person,
                      number,
                      'masculine',
                      tenseData[person][number].masculine
                    )}
                    {tenseData[person][number].feminine !==
                      tenseData[person][number].masculine && (
                      <Text style={styles.feminineSuffix}>
                        {tenseData[person][number].feminine}
                      </Text>
                    )}
                  </>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Verb Header */}
      <View style={styles.header}>
        <Text style={styles.verb}>{verb}</Text>
      </View>

      {/* Tense Selector */}
      <View style={styles.tenseSelector}>
        {tenses.map((tense) => (
          <TouchableOpacity
            key={tense}
            style={[
              styles.tenseButton,
              selectedTense === tense && styles.selectedTenseButton,
            ]}
            onPress={() => setSelectedTense(tense)}
          >
            <Text
              style={[
                styles.tenseButtonText,
                selectedTense === tense && styles.selectedTenseButtonText,
              ]}
            >
              {formatTense(tense)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conjugation Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        {renderConjugationGrid()}
      </ScrollView>
    </ScrollView>
  );
};

const formatTense = (tense: string): string => {
  return tense.charAt(0).toUpperCase() + tense.slice(1);
};

const formatPerson = (person: string): string => {
  const labels: Record<string, string> = {
    first: '1st',
    second: '2nd',
    third: '3rd',
  };
  return labels[person] || person;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2c3e50',
    padding: 20,
    alignItems: 'center',
  },
  verb: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  tenseSelector: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tenseButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
  },
  selectedTenseButton: {
    backgroundColor: '#3498db',
  },
  tenseButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  selectedTenseButtonText: {
    color: '#fff',
  },
  grid: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#34495e',
  },
  headerCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  headerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  labelCell: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    minWidth: 60,
  },
  labelText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  cellContainer: {
    flex: 1,
    minWidth: 80,
  },
  cell: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 18,
    color: '#2c3e50',
  },
  feminineSuffix: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingBottom: 4,
  },
});

