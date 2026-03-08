import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface JobCardProps {
  title: string;
  estate: string;
  slots: string[];
  status?: string;
  applicantCount?: number;
  matchScore?: number;
  onPress?: () => void;
}

export function JobCard({
  title,
  estate,
  slots,
  status,
  applicantCount,
  matchScore,
  onPress,
}: JobCardProps) {
  const hoursPerWeek = slots.length * 3;

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {status && <Badge label={status} />}
          {matchScore !== undefined && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{Math.round(matchScore * 100)}%</Text>
            </View>
          )}
        </View>
        <Text style={styles.detail}>{estate} · {hoursPerWeek} hours required/week</Text>
        {slots.length > 0 && (
          <Text style={styles.slots}>{slots.join(', ')}</Text>
        )}
        {applicantCount !== undefined && applicantCount > 0 && (
          <Text style={styles.applicants}>
            {applicantCount} applicant{applicantCount !== 1 ? 's' : ''}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  title: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', flex: 1 },
  detail: { fontSize: 14, color: '#666', marginBottom: 4 },
  slots: { fontSize: 13, color: '#999' },
  applicants: { fontSize: 13, color: '#4361ee', fontWeight: '600', marginTop: 6 },
  scoreBadge: {
    backgroundColor: '#4361ee',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scoreText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
