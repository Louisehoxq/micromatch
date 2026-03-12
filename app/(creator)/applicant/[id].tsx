import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
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
  job_title: string;
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
        job:jobs(title),
        profile:profiles!applications_jobber_id_fkey(
          full_name, estate, avatar_url,
          jobber_profile:jobber_profiles(bio, available_slots),
          jobber_skills(proficiency, skill:skills(name))
        )
      `)
      .eq('id', id)
      .single();

    if (error || !row) {
      setLoading(false);
      return;
    }

    const profile = (row.profile as any) ?? {};
    const jp = Array.isArray(profile.jobber_profile)
      ? profile.jobber_profile[0]
      : profile.jobber_profile;

    setData({
      applicationId: row.id,
      status: row.status,
      job_title: (row.job as any)?.title ?? '',
      full_name: profile.full_name ?? '',
      estate: profile.estate ?? '',
      avatar_url: profile.avatar_url ?? null,
      bio: jp?.bio ?? '',
      available_slots: jp?.available_slots ?? [],
      skills: (profile.jobber_skills ?? []).map((s: any) => ({
        name: s.skill?.name ?? '',
        proficiency: s.proficiency,
      })),
    });
    setLoading(false);
  }

  async function handleUpdateStatus(status: 'offer_pending' | 'withdrawn_by_creator') {
    const label = status === 'offer_pending' ? 'Accept' : 'Reject';
    if (Platform.OS === 'web') {
      if (!window.confirm(`Are you sure you want to ${label.toLowerCase()} this applicant?`)) return;
      setActing(true);
      const { error } = await supabase.from('applications').update({ status }).eq('id', id);
      if (error) { window.alert(error.message); setActing(false); return; }
      await fetchApplicant();
      setActing(false);
    } else {
      Alert.alert(label, `Are you sure you want to ${label.toLowerCase()} this applicant?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: label,
          style: status === 'offer_pending' ? 'default' : 'destructive',
          onPress: async () => {
            setActing(true);
            const { error } = await supabase.from('applications').update({ status }).eq('id', id);
            if (error) { Alert.alert('Error', error.message); setActing(false); return; }
            await fetchApplicant();
            setActing(false);
          },
        },
      ]);
    }
  }

  async function handleEmail() {
    const { data: email, error } = await supabase.rpc('get_applicant_email', {
      p_application_id: id,
    });
    if (error || !email) {
      Platform.OS === 'web' ? window.alert('Could not retrieve email.') : Alert.alert('Contact', 'Could not retrieve email.');
      return;
    }
    const url = `mailto:${email}`;
    if (Platform.OS === 'web') {
      window.open(url);
    } else {
      const canOpen = await Linking.canOpenURL(url);
      canOpen ? Linking.openURL(url) : Alert.alert('Email', email);
    }
  }

  async function handleCall() {
    const { data: phone, error } = await supabase.rpc('get_applicant_phone', {
      p_application_id: id,
    });
    if (error || !phone) {
      Platform.OS === 'web' ? window.alert('No phone number on file.') : Alert.alert('Contact', 'No phone number on file.');
      return;
    }
    const url = `tel:${phone}`;
    if (Platform.OS === 'web') {
      window.open(url);
    } else {
      const canOpen = await Linking.canOpenURL(url);
      canOpen ? Linking.openURL(url) : Alert.alert('Phone', phone);
    }
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

      {!!data.job_title && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job</Text>
          <Text style={styles.bio}>{data.job_title}</Text>
        </View>
      )}

      {!!data.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{data.bio}</Text>
        </View>
      )}

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

      <View style={styles.actionsSection}>
        <View style={styles.contactRow}>
          <TouchableOpacity style={[styles.contactBtn, { flex: 1 }]} onPress={handleEmail}>
            <Text style={styles.contactBtnText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactBtn, styles.callBtn, { flex: 1 }]} onPress={handleCall}>
            <Text style={[styles.contactBtnText, styles.callBtnText]}>Call</Text>
          </TouchableOpacity>
        </View>
        {canAct && (
          <View style={styles.decisionRow}>
            <Button
              title={acting ? '...' : 'Accept'}
              onPress={() => handleUpdateStatus('offer_pending')}
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
  contactRow: { flexDirection: 'row', gap: 12 },
  contactBtn: {
    borderWidth: 1.5,
    borderColor: '#4361ee',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  callBtn: { borderColor: '#27ae60' },
  contactBtnText: { fontSize: 15, color: '#4361ee', fontWeight: '600' },
  callBtnText: { color: '#27ae60' },
  decisionRow: { flexDirection: 'row', gap: 12 },
});
