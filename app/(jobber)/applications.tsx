import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApplications } from '../../src/hooks/useApplications';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { JOBBER_STATUS_LABELS } from '../../src/types/database';

export default function ApplicationsScreen() {
  const { applications, loading, refresh, withdrawApplication } = useApplications();
  const router = useRouter();

  function handleWithdraw(applicationId: string) {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await withdrawApplication(applicationId);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  if (applications.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No applications yet</Text>
        <Text style={styles.emptyHint}>Apply to jobs from the Matches tab</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={applications}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      onRefresh={refresh}
      refreshing={loading}
      renderItem={({ item }) => {
        const job = item.job as any;
        const hoursPerWeek = (job?.required_slots?.length ?? 0) * 3;
        const statusLabel = JOBBER_STATUS_LABELS[item.status] ?? item.status;
        const canWithdraw = item.status === 'pending' || item.status === 'under_review';

        const isTappable = item.status === 'accepted' || item.status === 'offer_pending';

        const cardContent = (
          <Card>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.title}>{job?.title}</Text>
                <Text style={styles.detail}>
                  {job?.estate} · {hoursPerWeek} hours required/week
                </Text>
              </View>
              <View style={styles.badgeRow}>
                <Badge status={item.status} label={statusLabel} />
                {isTappable && (
                  <Ionicons name="chevron-forward" size={18} color="#aaa" style={{ marginLeft: 6 }} />
                )}
              </View>
            </View>
            {canWithdraw && (
              <Button
                title="Withdraw"
                variant="danger"
                onPress={() => handleWithdraw(item.id)}
                style={{ marginTop: 10 }}
              />
            )}
          </Card>
        );

        if (isTappable) {
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/(jobber)/commitment/${item.id}`)}
            >
              {cardContent}
            </TouchableOpacity>
          );
        }

        return cardContent;
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  empty: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptyHint: { fontSize: 14, color: '#999', marginTop: 8 },
  list: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  detail: { fontSize: 14, color: '#666', marginTop: 4 },
});
