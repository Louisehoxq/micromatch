import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useApplications } from '../../src/hooks/useApplications';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';

export default function ApplicationsScreen() {
  const { applications, loading, refresh } = useApplications();

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
      renderItem={({ item }) => (
        <Card>
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.title}>{(item.job as any)?.title}</Text>
              <Text style={styles.detail}>
                {(item.job as any)?.estate} · {(item.job as any)?.hours_per_week}h/week
              </Text>
            </View>
            <Badge label={item.status} />
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
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  detail: { fontSize: 14, color: '#666', marginTop: 4 },
});
