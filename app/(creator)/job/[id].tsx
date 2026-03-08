import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useCreatorApplications } from '../../../src/hooks/useCreatorApplications';
import { Job } from '../../../src/types/database';
import { APPLICATION_STATUS_LABELS } from '../../../src/types/database';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Avatar } from '../../../src/components/ui/Avatar';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const { applicants, loading, stats, updateStatus, refresh } = useCreatorApplications(id);

  useEffect(() => {
    fetchJob();
  }, [id]);

  async function fetchJob() {
    setJobLoading(true);
    const { data } = await supabase.from('jobs').select('*').eq('id', id).single();
    if (data) setJob(data);
    setJobLoading(false);
  }

  async function handleUpdateStatus(applicationId: string, status: 'accepted' | 'withdrawn_by_creator') {
    try {
      await updateStatus(applicationId, status);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  if (jobLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text>Job not found</Text>
      </View>
    );
  }

  const hoursPerWeek = job.required_slots.length * 3;
  const hasRemuneration = job.remuneration_per_hour_min != null || job.remuneration_per_hour_max != null;

  return (
    <FlatList
      data={applicants}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      onRefresh={refresh}
      refreshing={loading}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{job.title}</Text>
          <Badge label={job.status} />
          <Text style={styles.detail}>
            {job.estate} · {hoursPerWeek} hours required/week
          </Text>
          {hasRemuneration && (
            <Text style={styles.remuneration}>
              ${job.remuneration_per_hour_min ?? '?'}–${job.remuneration_per_hour_max ?? '?'}/hr
            </Text>
          )}
          {job.description ? <Text style={styles.desc}>{job.description}</Text> : null}
          {job.required_slots.length > 0 && (
            <Text style={styles.days}>Slots: {job.required_slots.join(', ')}</Text>
          )}
          <View style={styles.statsBar}>
            <Text style={styles.statsText}>
              {stats.total} applicant{stats.total !== 1 ? 's' : ''} · {stats.reviewed} reviewed · {stats.accepted} committed
            </Text>
          </View>
          <Text style={styles.sectionTitle}>
            Applicants ({applicants.length})
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>No applicants yet</Text>
      }
      renderItem={({ item }) => {
        const statusLabel = APPLICATION_STATUS_LABELS[item.status] ?? item.status;
        const canAct = item.status === 'under_review' || item.status === 'pending';

        return (
          <Card>
            <View style={styles.applicantRow}>
              <Avatar name={(item.jobber as any)?.full_name} size={40} />
              <View style={styles.applicantInfo}>
                <Text style={styles.applicantName}>{(item.jobber as any)?.full_name}</Text>
                <Text style={styles.applicantEstate}>{(item.jobber as any)?.estate}</Text>
              </View>
              <Badge status={item.status} label={statusLabel} />
            </View>
            {canAct && (
              <View style={styles.actions}>
                <Button
                  title="Accept"
                  onPress={() => handleUpdateStatus(item.id, 'accepted')}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Withdraw"
                  onPress={() => handleUpdateStatus(item.id, 'withdrawn_by_creator')}
                  variant="danger"
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  detail: { fontSize: 15, color: '#666', marginTop: 8 },
  remuneration: { fontSize: 15, color: '#27ae60', fontWeight: '600', marginTop: 4 },
  desc: { fontSize: 15, color: '#444', marginTop: 8, lineHeight: 22 },
  days: { fontSize: 14, color: '#999', marginTop: 4 },
  statsBar: {
    backgroundColor: '#f5f7ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  statsText: { fontSize: 14, color: '#4361ee', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginTop: 20, marginBottom: 8 },
  empty: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 20 },
  applicantRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  applicantInfo: { flex: 1 },
  applicantName: { fontSize: 16, fontWeight: '600', color: '#333' },
  applicantEstate: { fontSize: 13, color: '#999' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
});
