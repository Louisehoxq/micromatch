import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useJobs } from '../../src/hooks/useJobs';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';

export default function MyJobsScreen() {
  const { jobs, loading, refresh } = useJobs();
  const router = useRouter();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No jobs posted yet</Text>
        <Text style={styles.emptyHint}>Tap "Post Job" to create your first listing</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      onRefresh={refresh}
      refreshing={loading}
      renderItem={({ item }) => (
        <Card>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Badge label={item.status} />
          </View>
          <Text style={styles.detail}>
            {item.estate} · {item.required_slots.length * 3} hours required/week
          </Text>
          {item.applicant_count > 0 && (
            <Text style={styles.applicants}>
              {item.applicant_count} applicant{item.applicant_count !== 1 ? 's' : ''}
            </Text>
          )}
          <View style={styles.actions}>
            <Button
              title="View Applicants"
              onPress={() => router.push(`/(creator)/job/${item.id}`)}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <Button
              title="Edit"
              onPress={() => router.push(`/(creator)/edit-job/${item.id}`)}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  empty: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptyHint: { fontSize: 14, color: '#999', marginTop: 8 },
  list: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  title: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', flex: 1 },
  detail: { fontSize: 14, color: '#666', marginBottom: 4 },
  applicants: { fontSize: 13, color: '#4361ee', fontWeight: '600', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
});
