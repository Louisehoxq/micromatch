import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useJobs } from '../../src/hooks/useJobs';
import { JobCard } from '../../src/components/JobCard';

export default function MyJobsScreen() {
  const { jobs, loading, refresh } = useJobs();
  const router = useRouter();

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
        <JobCard
          title={item.title}
          estate={item.estate}
          hoursPerWeek={item.hours_per_week}
          days={item.required_days}
          status={item.status}
          applicantCount={item.applicant_count}
          onPress={() => router.push(`/(creator)/job/${item.id}`)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  empty: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptyHint: { fontSize: 14, color: '#999', marginTop: 8 },
  list: { padding: 16 },
});
