// @ts-nocheck — HTML intrinsic elements are valid in react-native-web context
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ESTATES } from '../lib/estates';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function EstatePicker({ value, onChange, placeholder, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyle}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {ESTATES.map(e => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
    </View>
  );
}

const selectStyle = {
  width: '100%',
  padding: '12px 16px',
  fontSize: 16,
  border: 'none',
  background: 'transparent',
  outline: 'none',
  cursor: 'pointer',
  color: '#333',
  appearance: 'auto',
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
});
