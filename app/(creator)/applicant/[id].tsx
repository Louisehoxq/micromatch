import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { APPLICATION_STATUS_LABELS, ApplicationStatus } from '../../../src/types/database';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';

const PROFICIENCY_LABELS: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Expert' };

function formatSlot(slot: string): string {
  const [day, period] = slot.split('_');
  const short: Record<string, string> = { morning: 'AM', afternoon: 'PM', evening: 'Eve' };
  return `${day} ${short[period] ?? period}`;
}

interface ApplicantData {
  applicationId: string;
  status: string;
  full_name: string;
  estate: string;
  avatar_url: string | null;
  bio: string;
  available_slots: string[];
  skills: { name: string; proficiency: number }[];
}

export default function ApplicantProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ApplicantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetchApplicant();
  }, [id]);

  async function fetchApplicant() {
    setLoading(true);
    const { data: row, error } = await supabase
      .from('applications')
      .select(`
        id, status,
        profile:profiles!applications_jobber_id_fkey(full_name, estate, avatar_url),
        jobber_profile:jobber_profiles(bio, available_slots),
        jobber_skills(proficiency, skill:skills(name))
      `)
      .eq('id', id)
      .single();

    if (error || !row) {
      setLoading(false);
      return;
    }

    const jp = Array.isArray(row.jobber_profile) ? row.jobber_profile[0] : row.jobber_profile;

    setData({
      applicationId: row.id,
      status: row.status,
      full_name: (row.profile as any)?.full_name ?? '',
      estate: (row.profile as any)?.estate ?? '',
      avatar_url: (row.profile as any)?.avatar_url ?? null,
      bio: jp?.bio ?? '',
      available_slots: jp?.available_slots ?? [],
      skills: (row.jobber_skills as any[]).map((s: any) => ({
        name: s.skill?.name ?? '',
        proficiency: s.proficiency,
      })),
    });
    setLoading(false);
  }

  async function handleUpdateStatus(status: 'accepted' | 'withdrawn_by_creator') {
    const label = status === 'accepted' ? 'Accept' : 'Reject';
    Alert.alert(label, `Are you sure you want to ${label.toLowerCase()} this applicant?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label,
        style: status === 'accepted' ? 'default' : 'destructive',
        onPress: async () => {
          setActing(true);
          const { error } = await supabase
            .from('applications')
            .update({ status })
            .eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
            setActing(false);
            return;
          }
          await fetchApplicant();
          setActing(false);
        },
      },
    ]);
  }

  async function handleContact() {
    const { data: email, error } = await supabase.rpc('get_applicant_email', {
      p_application_id: id,
    });
    if (error || !email) {
      Alert.alert('Contact', 'Could not retrieve contact details.');
      return;
    }
    Linking.openURL(`mailto:${email}`);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Applicant not found</Text>
      </View>
    );
  }

  const statusLabel = APPLICATION_STATUS_LABELS[data.status as ApplicationStatus] ?? data.status;
  const canAct = data.status === 'under_review' || data.status === 'pending';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <Avatar name={data.full_name} size={72} />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{data.full_name}</Text>
          <Text style={styles.estate}>{data.estate}</Text>
          <View style={{ marginTop: 6 }}>
            <Badge status={data.status as ApplicationStatus} label={statusLabel} />
          </View>
        </View>
      </View>

      {/* Bio */}
      {!!data.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{data.bio}</Text>
        </View>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {data.skills.map((sk, i) => (
            <View key={i} style={styles.skillRow}>
              <Text style={styles.skillName}>{sk.name}</Text>
              <View style={styles.proficiencyBadge}>
                <Text style={styles.proficiencyText}>
                  {PROFICIENCY_LABELS[sk.proficiency] ?? sk.proficiency}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Availability */}
      {data.available_slots.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.tagRow}>
            {data.available_slots.map((slot, i) => (
              <View key={i} style={styles.slotTag}>
                <Text style={styles.slotTagText}>{formatSlot(slot)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
          <Text style={styles.contactBtnText}>Contact Applicant</Text>
        </TouchableOpacity>
        {canAct && (
          <View style={styles.decisionRow}>
            <Button
              title={acting ? '...' : 'Accept'}
              onPress={() => handleUpdateStatus('accepted')}
              disabled={acting}
              style={{ flex: 1 }}
            />
            <Button
              title={acting ? '...' : 'Reject'}
              onPress={() => handleUpdateStatus('withdrawn_by_creator')}
              variant="danger"
              disabled={acting}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#999' },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileInfo: { flex: 1 },
  name: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  estate: { fontSize: 15, color: '#777', marginTop: 2 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },

  bio: { fontSize: 15, color: '#444', lineHeight: 22 },

  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  skillName: { fontSize: 15, color: '#333', fontWeight: '500' },
  proficiencyBadge: {
    backgroundColor: '#eef2ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  proficiencyText: { fontSize: 13, color: '#4361ee', fontWeight: '600' },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotTag: {
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  slotTagText: { fontSize: 13, color: '#27ae60', fontWeight: '500' },

  actionsSection: { marginTop: 8, gap: 12 },
  contactBtn: {
    borderWidth: 1.5,
    borderColor: '#4361ee',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  contactBtnText: { fontSize: 15, color: '#4361ee', fontWeight: '600' },
  decisionRow: { flexDirection: 'row', gap: 12 },
});
