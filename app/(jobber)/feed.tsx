import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useMatchedJobs } from '../../src/hooks/useMatchedJobs';
import { useApplications } from '../../src/hooks/useApplications';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';

export default function FeedScreen() {
  const { matches, loading, fetchMatches } = useMatchedJobs();
  const { applyToJob } = useApplications();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  async function handleApply(jobId: string) {
    try {
      await applyToJob(jobId);
      alert('Your application has been submitted!');
      fetchMatches();
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
      renderItem={({ item }) => {
        const hoursPerWeek = item.required_slots.length * 3;
        const isExpanded = expandedJobId === item.job_id;
        const hasPhotos = item.job_photos && item.job_photos.length > 0;
        const hasRemuneration = item.remuneration_per_hour_min != null || item.remuneration_per_hour_max != null;

        return (
          <Card>
            <View style={styles.matchHeader}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{Math.round(item.total_score * 100)}%</Text>
              </View>
            </View>
            <Text style={styles.creator}>by {item.creator_name}</Text>
            <Text style={styles.matchSubtitle}>
              {Math.round(item.total_score * 100)}% match with your preferences
            </Text>
            <Text style={styles.detail}>{item.estate} · {hoursPerWeek} hours required/week</Text>
            {item.description ? (
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => setExpandedJobId(isExpanded ? null : item.job_id)}
            >
              <Text style={styles.expandBtnText}>
                {isExpanded ? 'Less details ▲' : 'More details ▼'}
              </Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.expandedSection}>
                {item.creator_bio ? (
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>About</Text>
                    <Text style={styles.expandedValue}>{item.creator_bio}</Text>
                  </View>
                ) : null}

                {hasPhotos && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                    {item.job_photos.map((photo, i) => (
                      <Image
                        key={i}
                        source={{ uri: photo.photo_url }}
                        style={styles.jobPhoto}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                )}

                <View style={styles.expandedRow}>
                  <Text style={styles.expandedLabel}>Remuneration</Text>
                  <Text style={styles.expandedValue}>
                    {hasRemuneration
                      ? `$${item.remuneration_per_hour_min ?? '?'}–$${item.remuneration_per_hour_max ?? '?'}/hr`
                      : 'Not specified'}
                  </Text>
                </View>

                {item.contact_number ? (
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>Contact</Text>
                    <Text style={styles.expandedValue}>{item.contact_number}</Text>
                  </View>
                ) : null}
              </View>
            )}

            <Button title="Apply" onPress={() => handleApply(item.job_id)} style={{ marginTop: 12 }} />
          </Card>
        );
      }}
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
  matchSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  detail: { fontSize: 14, color: '#666', marginTop: 4 },
  desc: { fontSize: 14, color: '#444', marginTop: 6, lineHeight: 20 },
  expandBtn: { marginTop: 10 },
  expandBtnText: { fontSize: 13, color: '#4361ee', fontWeight: '600' },
  expandedSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  expandedRow: { marginBottom: 8 },
  expandedLabel: { fontSize: 12, color: '#999', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  expandedValue: { fontSize: 14, color: '#333', lineHeight: 20 },
  photoScroll: { marginVertical: 8 },
  jobPhoto: { width: 220, height: 160, borderRadius: 10, marginRight: 10 },
});
