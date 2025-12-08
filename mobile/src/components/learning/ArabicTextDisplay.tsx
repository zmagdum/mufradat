/**
 * Arabic Text Display Component
 * Displays Arabic text with proper styling and calligraphy
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ArabicTextDisplayProps {
  text: string;
  style?: 'naskh' | 'thuluth' | 'kufi' | 'ruqah';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  color?: string;
  showDiacritics?: boolean;
}

export const ArabicTextDisplay: React.FC<ArabicTextDisplayProps> = ({
  text,
  style = 'naskh',
  size = 'medium',
  color = '#000',
  showDiacritics = true,
}) => {
  const fontSize = getFontSize(size);

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.arabicText,
          {
            fontSize,
            color,
            fontFamily: getArabicFont(style),
          },
        ]}
      >
        {showDiacritics ? text : removeDiacritics(text)}
      </Text>
    </View>
  );
};

const getFontSize = (size: string): number => {
  const sizes = {
    small: 18,
    medium: 24,
    large: 32,
    xlarge: 48,
  };
  return sizes[size as keyof typeof sizes] || 24;
};

const getArabicFont = (style: string): string => {
  // Note: These fonts would need to be loaded via expo-font
  const fonts = {
    naskh: 'AmiriRegular', // Default Arabic font
    thuluth: 'AmiriRegular',
    kufi: 'AmiriRegular',
    ruqah: 'AmiriRegular',
  };
  return fonts[style as keyof typeof fonts] || 'AmiriRegular';
};

const removeDiacritics = (text: string): string => {
  // Remove Arabic diacritics (harakat)
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  arabicText: {
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});

