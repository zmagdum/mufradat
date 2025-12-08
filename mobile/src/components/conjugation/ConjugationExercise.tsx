/**
 * Conjugation Exercise Component
 * Interactive practice exercises for verb conjugations
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface ConjugationExerciseProps {
  question: {
    verb: string;
    prompt: string;
    correctAnswer: string;
    hint?: string;
  };
  onSubmit: (isCorrect: boolean, userAnswer: string) => void;
}

export const ConjugationExercise: React.FC<ConjugationExerciseProps> = ({
  question,
  onSubmit,
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    const correct = normalizeArabic(userAnswer) === normalizeArabic(question.correctAnswer);
    setIsCorrect(correct);
    setSubmitted(true);
    onSubmit(correct, userAnswer);
  };

  const handleNext = () => {
    setUserAnswer('');
    setSubmitted(false);
    setShowHint(false);
    setIsCorrect(false);
  };

  return (
    <View style={styles.container}>
      {/* Verb */}
      <View style={styles.verbContainer}>
        <Text style={styles.verb}>{question.verb}</Text>
      </View>

      {/* Prompt */}
      <View style={styles.promptContainer}>
        <Text style={styles.prompt}>{question.prompt}</Text>
      </View>

      {/* Input */}
      <TextInput
        style={[
          styles.input,
          submitted && (isCorrect ? styles.correctInput : styles.incorrectInput),
        ]}
        value={userAnswer}
        onChangeText={setUserAnswer}
        placeholder="Enter conjugated form..."
        editable={!submitted}
        autoFocus
      />

      {/* Hint Button */}
      {question.hint && !submitted && (
        <TouchableOpacity
          style={styles.hintButton}
          onPress={() => setShowHint(!showHint)}
        >
          <Text style={styles.hintButtonText}>
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Hint Display */}
      {showHint && question.hint && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>{question.hint}</Text>
        </View>
      )}

      {/* Feedback */}
      {submitted && (
        <View style={[
          styles.feedback,
          isCorrect ? styles.correctFeedback : styles.incorrectFeedback,
        ]}>
          <Text style={styles.feedbackText}>
            {isCorrect ? '✓ Correct!' : `✗ Incorrect. Correct answer: ${question.correctAnswer}`}
          </Text>
        </View>
      )}

      {/* Submit/Next Button */}
      <TouchableOpacity
        style={[styles.button, submitted && styles.nextButton]}
        onPress={submitted ? handleNext : handleSubmit}
        disabled={!userAnswer.trim()}
      >
        <Text style={styles.buttonText}>
          {submitted ? 'Next Question' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const normalizeArabic = (text: string): string => {
  // Remove diacritics and extra spaces for comparison
  return text.replace(/[\u064B-\u065F\u0670]/g, '').trim();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  verbContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
  },
  verb: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  promptContainer: {
    backgroundColor: '#e8f4f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  prompt: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },
  input: {
    borderWidth: 2,
    borderColor: '#bdc3c7',
    borderRadius: 10,
    padding: 15,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 15,
    color: '#2c3e50', // Text color for input fields
  },
  correctInput: {
    borderColor: '#2ecc71',
    backgroundColor: '#d5f4e6',
  },
  incorrectInput: {
    borderColor: '#e74c3c',
    backgroundColor: '#fadbd8',
  },
  hintButton: {
    padding: 10,
    alignItems: 'center',
  },
  hintButtonText: {
    color: '#3498db',
    fontSize: 14,
  },
  hintContainer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  hintText: {
    fontSize: 14,
    color: '#856404',
  },
  feedback: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  correctFeedback: {
    backgroundColor: '#d5f4e6',
  },
  incorrectFeedback: {
    backgroundColor: '#fadbd8',
  },
  feedbackText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

