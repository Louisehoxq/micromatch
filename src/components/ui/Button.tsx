import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const bgColor = variant === 'primary' ? '#4361ee' : variant === 'danger' ? '#e63946' : '#fff';
  const textColor = variant === 'secondary' ? '#4361ee' : '#fff';
  const borderColor = variant === 'secondary' ? '#4361ee' : bgColor;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor, borderColor }, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: '600' },
});
