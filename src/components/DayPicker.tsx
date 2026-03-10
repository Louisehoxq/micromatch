import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DayOfWeek, TimeSlot, TimeSlotPeriod } from '../types/database';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PERIODS: { key: TimeSlotPeriod; label: string; time: string }[] = [
  { key: 'morning', label: 'Morning', time: '9–12pm' },
  { key: 'afternoon', label: 'Afternoon', time: '2–5pm' },
  { key: 'evening', label: 'Evening', time: '6–9pm' },
];

interface DayPickerProps {
  selected: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
  label?: string;
}

export function DayPicker({ selected, onChange, label }: DayPickerProps) {
  function toggle(slot: TimeSlot) {
    if (selected.includes(slot)) {
      onChange(selected.filter(s => s !== slot));
    } else {
      onChange([...selected, slot]);
    }
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.grid}>
        {/* Header row */}
        <View style={styles.row}>
          <View style={styles.dayLabel} />
          {PERIODS.map(p => (
            <View key={p.key} style={styles.colHeader}>
              <Text style={styles.colHeaderText}>{p.label}</Text>
              <Text style={styles.colHeaderTime}>{p.time}</Text>
            </View>
          ))}
        </View>
        {/* Day rows */}
        {DAYS.map(day => (
          <View key={day} style={styles.row}>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>{day}</Text>
            </View>
            {PERIODS.map(p => {
              const slot = `${day}_${p.key}` as TimeSlot;
              const active = selected.includes(slot);
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.cell, active && styles.cellActive]}
                  onPress={() => toggle(slot)}
                >
                  {active && <Text style={styles.cellCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  grid: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  dayLabel: { width: 44, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  dayText: { fontSize: 12, fontWeight: '600', color: '#555' },
  colHeader: { flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: '#f9f9f9' },
  colHeaderText: { fontSize: 11, fontWeight: '700', color: '#555' },
  colHeaderTime: { fontSize: 10, color: '#999' },
  cell: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cellActive: { borderColor: '#4361ee', backgroundColor: '#eef0ff' },
  cellCheck: { fontSize: 14, color: '#4361ee', fontWeight: '700' },
});
