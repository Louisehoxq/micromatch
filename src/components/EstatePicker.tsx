import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
      <Picker selectedValue={value} onValueChange={onChange}>
        {placeholder && <Picker.Item label={placeholder} value="" />}
        {ESTATES.map(e => (
          <Picker.Item key={e} label={e} value={e} />
        ))}
      </Picker>
    </View>
  );
}

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
