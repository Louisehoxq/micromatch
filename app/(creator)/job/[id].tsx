import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useCreatorApplications, ApplicantDetail } from '../../../src/hooks/useCreatorApplications';
import { Job } from '../../../src/types/database';
import { APPLICATION_STATUS_LABELS, ApplicationStatus } from '../../../src/types/database';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Avatar } from '../../../src/components/ui/Avatar';

const PROFICIENCY_LABELS: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Expert' };

function formatSlot(slot: string): string {
  const [day, period] = slot.split('_');
  const short: Record<string, string> = { morning: 'AM', afternoon: 'PM', evening: 'Eve' };
  return `${day} ${short[period] ?? period}`;
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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

  async function handleUpdateStatus(applicationId: string, status: 'withdrawn_by_creator') {
    try {
      await updateStatus(applicationId, status);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleContact(applicationId: string, name: string) {
    Alert.alert(`Contact ${name}`, 'How would you like to reach out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Email',
        onPress: async () => {
          const { data: email, error } = await supabase.rpc('get_applicant_email', {
            p_application_id: applicationId,
          });
          if (error || !email) {
            Alert.alert('Contact', 'Could not retrieve email.');
            return;
          }
          const url = `mailto:${email}`;
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            Linking.openURL(url);
          } else {
            Alert.alert('Email', email);
          }
        },
      },
      {
        text: 'Call',
        onPress: async () => {
          const { data: phone, error } = await supabase.rpc('get_applicant_phone', {
            p_application_id: applicationId,
          });
          if (error || !phone) {
            Alert.alert('Contact', 'No phone number on file.');
            return;
          }
          const url = `tel:${phone}`;
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            Linking.openURL(url);
          } else {
            Alert.alert('Phone', phone);
          }
        },
      },
    ]);
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
          <View style={styles.titleRow}>
            <Text style={styles.title}>{job.title}</Text>
            <Button
              title="Edit"
              variant="secondary"
              onPress={() => router.push(`/(creator)/edit-job/${id}`)}
              style={{ paddingHorizontal: 16, paddingVertical: 8 }}
            />
          </View>
          <Badge label={job.status} />
          <Text style={styles.detail}>
            {job.estate} · {hoursPerWeek} hrs/week
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
          <Text style={styles.sectionTitle}>Applicants ({applicants.length})</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No applicants yet</Text>}
      renderItem={({ item }: { item: ApplicantDetail }) => {
        const statusLabel = APPLICATION_STATUS_LABELS[item.status as ApplicationStatus] ?? item.status;
        const canAct = item.status === 'under_review' || item.status === 'pending';

        return (
          <Card>
            {/* Name + estate + badge — tappable to open full profile */}
            <TouchableOpacity
              onPress={() => router.push(`/(creator)/applicant/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.applicantRow}>
                <Avatar name={item.full_name} size={44} />
                <View style={styles.applicantInfo}>
                  <Text style={styles.applicantName}>{item.full_name}</Text>
                  <Text style={styles.applicantEstate}>{item.estate}</Text>
                </View>
                <View style={styles.badgeChevron}>
                  <Badge status={item.status as ApplicationStatus} label={statusLabel} />
                  <Text style={styles.chevron}>›</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Bio */}
            {!!item.bio && (
              <Text style={styles.bio}>{item.bio}</Text>
            )}

            {/* Skills */}
            {item.skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.subLabel}>Skills</Text>
                <View style={styles.tagRow}>
                  {item.skills.map((sk, i) => (
                    <View key={i} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>
                        {sk.name} · {PROFICIENCY_LABELS[sk.proficiency] ?? sk.proficiency}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Availability */}
            {item.available_slots.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.subLabel}>Availability</Text>
                <View style={styles.tagRow}>
                  {item.available_slots.map((slot, i) => (
                    <View key={i} style={styles.slotTag}>
                      <Text style={styles.slotTagText}>{formatSlot(slot)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => handleContact(item.id, item.full_name)}
              >
                <Text style={styles.contactBtnText}>Contact</Text>
              </TouchableOpacity>
              {canAct && (
                <>
                  <Button
                    title="Accept"
                    onPress={() => router.push(`/(creator)/send-offer/${item.id}`)}
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Reject"
                    onPress={() => handleUpdateStatus(item.id, 'withdrawn_by_creator')}
                    variant="danger"
                    style={styles.actionBtn}
                  />
                </>
              )}
            </View>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', flex: 1 },
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

  applicantRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  badgeChevron: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chevron: { fontSize: 22, color: '#ccc', marginTop: -1 },
  applicantInfo: { flex: 1 },
  applicantName: { fontSize: 16, fontWeight: '600', color: '#333' },
  applicantEstate: { fontSize: 13, color: '#999' },

  bio: { fontSize: 14, color: '#555', marginTop: 10, lineHeight: 20 },

  section: { marginTop: 10 },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillTag: {
    backgroundColor: '#eef2ff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skillTagText: { fontSize: 13, color: '#4361ee', fontWeight: '500' },
  slotTag: {
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  slotTagText: { fontSize: 13, color: '#27ae60', fontWeight: '500' },

  actions: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
  contactBtn: {
    borderWidth: 1.5,
    borderColor: '#4361ee',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  contactBtnText: { fontSize: 14, color: '#4361ee', fontWeight: '600' },
  actionBtn: { flex: 1 },
});
