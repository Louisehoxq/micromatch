import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
}

const PRESETS: Record<string, { color: string; bg: string }> = {
  pending: { color: '#e67e22', bg: '#fef3e2' },
  accepted: { color: '#27ae60', bg: '#e8f8f0' },
  rejected: { color: '#e63946', bg: '#fde8ea' },
  open: { color: '#4361ee', bg: '#eef0ff' },
  closed: { color: '#666', bg: '#f0f0f0' },
  filled: { color: '#27ae60', bg: '#e8f8f0' },
};

export function Badge({ label, color, bgColor }: BadgeProps) {
  const preset = PRESETS[label.toLowerCase()];
  const c = color ?? preset?.color ?? '#333';
  const bg = bgColor ?? preset?.bg ?? '#f0f0f0';

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: c }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});
