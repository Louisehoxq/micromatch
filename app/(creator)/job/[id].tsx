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
import { Job, ApplicationWithJobber } from '../../../src/types/database';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Avatar } from '../../../src/components/ui/Avatar';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<ApplicationWithJobber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    const [jobRes, appRes] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', id).single(),
      supabase
        .from('applications')
        .select('*, jobber:profiles!applications_jobber_id_fkey(full_name, estate, avatar_url)')
        .eq('job_id', id)
        .order('created_at', { ascending: false }),
    ]);
    if (jobRes.data) setJob(jobRes.data);
    if (appRes.data) setApplicants(appRes.data as any);
    setLoading(false);
  }

  async function handleUpdateStatus(applicationId: string, status: 'accepted' | 'rejected') {
    try {
      await supabase.from('applications').update({ status }).eq('id', applicationId);
      await fetchData();
    } catch (error: any) {
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

  if (!job) {
    return (
      <View style={styles.center}>
        <Text>Job not found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={applicants}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{job.title}</Text>
          <Badge label={job.status} />
          <Text style={styles.detail}>{job.estate} · {job.hours_per_week}h/week</Text>
          {job.description ? <Text style={styles.desc}>{job.description}</Text> : null}
          {job.required_days.length > 0 && (
            <Text style={styles.days}>Days: {job.required_days.join(', ')}</Text>
          )}
          <Text style={styles.sectionTitle}>
            Applicants ({applicants.length})
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>No applicants yet</Text>
      }
      renderItem={({ item }) => (
        <Card>
          <View style={styles.applicantRow}>
            <Avatar name={(item.jobber as any)?.full_name} size={40} />
            <View style={styles.applicantInfo}>
              <Text style={styles.applicantName}>{(item.jobber as any)?.full_name}</Text>
              <Text style={styles.applicantEstate}>{(item.jobber as any)?.estate}</Text>
            </View>
            <Badge label={item.status} />
          </View>
          {item.status === 'pending' && (
            <View style={styles.actions}>
              <Button
                title="Accept"
                onPress={() => handleUpdateStatus(item.id, 'accepted')}
                style={{ flex: 1 }}
              />
              <Button
                title="Reject"
                onPress={() => handleUpdateStatus(item.id, 'rejected')}
                variant="danger"
                style={{ flex: 1 }}
              />
            </View>
          )}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  detail: { fontSize: 15, color: '#666', marginTop: 8 },
  desc: { fontSize: 15, color: '#444', marginTop: 8, lineHeight: 22 },
  days: { fontSize: 14, color: '#999', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginTop: 20, marginBottom: 8 },
  empty: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 20 },
  applicantRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  applicantInfo: { flex: 1 },
  applicantName: { fontSize: 16, fontWeight: '600', color: '#333' },
  applicantEstate: { fontSize: 13, color: '#999' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
});
