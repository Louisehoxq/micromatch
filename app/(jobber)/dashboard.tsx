import React, { useEffect } from 'react';
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
import { useApplications } from '../../src/hooks/useApplications';
import { useMatchedJobs } from '../../src/hooks/useMatchedJobs';
import { Badge } from '../../src/components/ui/Badge';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Avatar } from '../../src/components/ui/Avatar';
import { JOBBER_STATUS_LABELS, ApplicationStatus } from '../../src/types/database';

export default function JobberDashboard() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const { applications, loading: appsLoading } = useApplications();
  const { matches, loading: matchesLoading, fetchMatches } = useMatchedJobs();

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  if (profileLoading || appsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  const total = applications.length;
  const underReview = applications.filter(a => a.status === 'under_review').length;
  const committed = applications.filter(a => a.status === 'accepted').length;
  const recent = applications.slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.greetingRow}>
        <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={48} />
        <View style={styles.greetingText}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{profile?.full_name || 'there'} 👋</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Applied</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4361ee' }]}>{underReview}</Text>
          <Text style={styles.statLabel}>Under Review</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#27ae60' }]}>{committed}</Text>
          <Text style={styles.statLabel}>Committed</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Matches</Text>
        {matchesLoading ? (
          <ActivityIndicator color="#4361ee" style={{ marginTop: 8 }} />
        ) : matches.length === 0 ? (
          <Text style={styles.empty}>No matches yet — complete your profile to get matched</Text>
        ) : (
          <Text style={styles.matchSummary}>
            {matches.length} job{matches.length !== 1 ? 's' : ''} match your profile
          </Text>
        )}
        <Button
          title="Browse Matches"
          onPress={() => router.push('/(jobber)/feed')}
          style={{ marginTop: 12 }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Applications</Text>
        {recent.length === 0 ? (
          <Text style={styles.empty}>No applications yet</Text>
        ) : (
          recent.map(app => {
            const job = app.job as any;
            const statusLabel = JOBBER_STATUS_LABELS[app.status as ApplicationStatus] ?? app.status;
            return (
              <Card key={app.id}>
                <View style={styles.appRow}>
                  <View style={styles.appInfo}>
                    <Text style={styles.appTitle} numberOfLines={1}>{job?.title}</Text>
                    <Text style={styles.appEstate}>{job?.estate}</Text>
                  </View>
                  <Badge status={app.status} label={statusLabel} />
                </View>
              </Card>
            );
          })
        )}
        {applications.length > 3 && (
          <TouchableOpacity onPress={() => router.push('/(jobber)/applications')}>
            <Text style={styles.viewAll}>View all {applications.length} applications →</Text>
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
  matchSummary: { fontSize: 15, color: '#555' },
  empty: { fontSize: 14, color: '#999' },
  appRow: { flexDirection: 'row', alignItems: 'center' },
  appInfo: { flex: 1 },
  appTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  appEstate: { fontSize: 13, color: '#999', marginTop: 2 },
  viewAll: { fontSize: 14, color: '#4361ee', fontWeight: '600', marginTop: 10 },
});
