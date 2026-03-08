import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../src/hooks/useProfile';
import { useJobs } from '../../src/hooks/useJobs';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';
import { Badge } from '../../src/components/ui/Badge';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Avatar } from '../../src/components/ui/Avatar';
import { APPLICATION_STATUS_LABELS, ApplicationStatus } from '../../src/types/database';

interface RecentApplicant {
  id: string;
  status: string;
  created_at: string;
  jobber: { full_name: string; estate: string; avatar_url: string | null };
  job: { title: string };
}

export default function CreatorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, creatorProfile, loading: profileLoading } = useProfile();
  const { jobs, loading: jobsLoading } = useJobs();
  const [recentApplicants, setRecentApplicants] = useState<RecentApplicant[]>([]);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [activityLoading, setActivityLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!user) return;
    setActivityLoading(true);

    const { data } = await supabase
      .from('applications')
      .select(`
        id, status, created_at,
        jobber:profiles!applications_jobber_id_fkey(full_name, estate, avatar_url),
        job:jobs!applications_job_id_fkey(title, creator_id)
      `)
      .eq('job.creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const list = (data ?? []) as any[];
    // Filter to only this creator's jobs (the eq on a joined table may not filter in all Supabase versions)
    const filtered = list.filter((a: any) => a.job?.creator_id === user.id);

    setTotalApplicants(filtered.length);
    setPendingReviews(filtered.filter((a: any) => a.status === 'under_review').length);
    setRecentApplicants(filtered.slice(0, 4) as RecentApplicant[]);
    setActivityLoading(false);
  }, [user]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (profileLoading || jobsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  const openJobs = jobs.filter(j => j.status === 'open').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.greetingRow}>
        <Avatar uri={creatorProfile?.avatar_url} name={profile?.full_name} size={48} />
        <View style={styles.greetingText}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{profile?.full_name || 'there'} 👋</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{openJobs}</Text>
          <Text style={styles.statLabel}>Open Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4361ee' }]}>{totalApplicants}</Text>
          <Text style={styles.statLabel}>Applicants</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#e67e22' }]}>{pendingReviews}</Text>
          <Text style={styles.statLabel}>To Review</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Button
          title="Post a New Job"
          onPress={() => router.push('/(creator)/create-job')}
        />
        <Button
          title="View My Jobs"
          onPress={() => router.push('/(creator)/my-jobs')}
          variant="secondary"
          style={{ marginTop: 10 }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Applicants</Text>
        {activityLoading ? (
          <ActivityIndicator color="#4361ee" style={{ marginTop: 8 }} />
        ) : recentApplicants.length === 0 ? (
          <Text style={styles.empty}>No applicants yet — post a job to get started</Text>
        ) : (
          recentApplicants.map(app => {
            const statusLabel = APPLICATION_STATUS_LABELS[app.status as ApplicationStatus] ?? app.status;
            return (
              <Card key={app.id}>
                <View style={styles.appRow}>
                  <Avatar uri={app.jobber?.avatar_url} name={app.jobber?.full_name} size={36} />
                  <View style={styles.appInfo}>
                    <Text style={styles.appName} numberOfLines={1}>{app.jobber?.full_name}</Text>
                    <Text style={styles.appJob} numberOfLines={1}>{app.job?.title}</Text>
                  </View>
                  <Badge status={app.status} label={statusLabel} />
                </View>
              </Card>
            );
          })
        )}
        {totalApplicants > 4 && (
          <TouchableOpacity onPress={() => router.push('/(creator)/my-jobs')}>
            <Text style={styles.viewAll}>View all jobs →</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fc' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  greetingText: { flex: 1 },
  greeting: { fontSize: 14, color: '#999' },
  name: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  empty: { fontSize: 14, color: '#999' },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appInfo: { flex: 1 },
  appName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  appJob: { fontSize: 13, color: '#999', marginTop: 2 },
  viewAll: { fontSize: 14, color: '#4361ee', fontWeight: '600', marginTop: 10 },
});
