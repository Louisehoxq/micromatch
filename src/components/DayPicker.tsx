import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DayOfWeek } from '../types/database';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface DayPickerProps {
  selected: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
  label?: string;
}

export function DayPicker({ selected, onChange, label }: DayPickerProps) {
  function toggle(day: DayOfWeek) {
    if (selected.includes(day)) {
      onChange(selected.filter(d => d !== day));
    } else {
      onChange([...selected, day]);
    }
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {DAYS.map(day => {
          const active = selected.includes(day);
          return (
            <TouchableOpacity
              key={day}
              style={[styles.day, active && styles.dayActive]}
              onPress={() => toggle(day)}
            >
              <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  dayActive: { borderColor: '#4361ee', backgroundColor: '#eef0ff' },
  dayText: { fontSize: 12, fontWeight: '600', color: '#999' },
  dayTextActive: { color: '#4361ee' },
});
