import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useMatchedJobs } from '../../src/hooks/useMatchedJobs';
import { useApplications } from '../../src/hooks/useApplications';
import { JobCard } from '../../src/components/JobCard';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';

export default function FeedScreen() {
  const { matches, loading, fetchMatches } = useMatchedJobs();
  const { applyToJob } = useApplications();

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  async function handleApply(jobId: string) {
    try {
      await applyToJob(jobId);
      alert('Your application has been submitted!');
      fetchMatches(); // Refresh to remove applied job
    } catch (error: any) {
      console.error('Apply error:', error);
      alert('Error: ' + error.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No matches found</Text>
        <Text style={styles.emptyHint}>
          Complete your profile and add skills to get matched with jobs
        </Text>
        <Button title="Refresh" onPress={fetchMatches} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <FlatList
      data={matches}
      keyExtractor={item => item.job_id}
      contentContainerStyle={styles.list}
      onRefresh={fetchMatches}
      refreshing={loading}
      ListHeaderComponent={
        <Text style={styles.headerText}>Top {matches.length} matches for you</Text>
      }
      renderItem={({ item }) => (
        <Card>
          <View style={styles.matchHeader}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{Math.round(item.total_score * 100)}%</Text>
            </View>
          </View>
          <Text style={styles.creator}>by {item.creator_name}</Text>
          <Text style={styles.detail}>{item.estate} · {item.hours_per_week}h/week</Text>
          {item.description ? (
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
          ) : null}

          <View style={styles.scores}>
            <Text style={styles.scoreItem}>Skills: {Math.round(item.skill_score * 100)}%</Text>
            <Text style={styles.scoreItem}>Location: {Math.round(item.location_score * 100)}%</Text>
            <Text style={styles.scoreItem}>Availability: {Math.round(item.availability_score * 100)}%</Text>
          </View>

          <Button title="Apply" onPress={() => handleApply(item.job_id)} style={{ marginTop: 12 }} />
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  empty: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptyHint: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
  list: { padding: 16 },
  headerText: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 12 },
  matchHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', flex: 1 },
  scoreBadge: {
    backgroundColor: '#4361ee',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  creator: { fontSize: 14, color: '#4361ee', marginTop: 4 },
  detail: { fontSize: 14, color: '#666', marginTop: 4 },
  desc: { fontSize: 14, color: '#444', marginTop: 6, lineHeight: 20 },
  scores: { flexDirection: 'row', gap: 12, marginTop: 10 },
  scoreItem: { fontSize: 12, color: '#999' },
});
