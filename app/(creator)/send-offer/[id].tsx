import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { generateContract } from '../../../src/lib/contractTemplate';

export default function SendOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // application id
  const router = useRouter();
  const [contractText, setContractText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    buildContract();
  }, [id]);

  async function buildContract() {
    setLoading(true);

    const { data: app } = await supabase
      .from('applications')
      .select('job_id, jobber_id')
      .eq('id', id)
      .single();

    if (!app) { setLoading(false); return; }

    const [{ data: job }, { data: jobber }] = await Promise.all([
      supabase
        .from('jobs')
        .select(`
          title, description, estate, required_slots, duration_weeks,
          remuneration_per_hour_min, remuneration_per_hour_max,
          creator:profiles!jobs_creator_id_fkey(full_name)
        `)
        .eq('id', app.job_id)
        .single(),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', app.jobber_id)
        .single(),
    ]);

    if (!job || !jobber) { setLoading(false); return; }

    const creator = Array.isArray(job.creator) ? job.creator[0] : job.creator;

    setContractText(generateContract({
      jobTitle: (job as any).title,
      estate: (job as any).estate,
      slots: (job as any).required_slots ?? [],
      durationWeeks: (job as any).duration_weeks ?? null,
      remunerationMin: (job as any).remuneration_per_hour_min ?? null,
      remunerationMax: (job as any).remuneration_per_hour_max ?? null,
      description: (job as any).description ?? '',
      creatorName: (creator as any)?.full_name ?? '',
      jobberName: (jobber as any).full_name ?? '',
    }));

    setLoading(false);
  }

  async function handleSendOffer() {
    setSending(true);
    try {
      const { error: contractErr } = await supabase
        .from('contracts')
        .insert({
          application_id: id,
          terms: contractText,
          creator_signed_at: new Date().toISOString(),
        });
      if (contractErr) throw contractErr;

      const { error: appErr } = await supabase
        .from('applications')
        .update({ status: 'offer_pending' })
        .eq('id', id);
      if (appErr) throw appErr;

      Alert.alert(
        'Offer Sent',
        'The jobber will receive the contract for review and signing.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  if (!contractText) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load contract details.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Review Contract</Text>
      <Text style={styles.subheading}>
        Review the auto-generated contract below. Sending this offer will ask the jobber to read and sign it.
      </Text>

      <View style={styles.contractBox}>
        <Text style={styles.contractText}>{contractText}</Text>
      </View>

      <TouchableOpacity
        style={[styles.sendBtn, sending && styles.btnDisabled]}
        onPress={handleSendOffer}
        disabled={sending}
      >
        <Text style={styles.sendBtnText}>{sending ? 'Sending…' : 'Send Offer'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.cancelBtn, sending && styles.btnDisabled]}
        onPress={() => router.back()}
        disabled={sending}
      >
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 15, color: '#999' },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  subheading: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 20 },
  contractBox: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#e0e4f5',
  },
  contractText: { fontSize: 13, color: '#333', lineHeight: 21, fontFamily: 'monospace' },
  sendBtn: {
    backgroundColor: '#4361ee',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  sendBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  cancelBtnText: { fontSize: 15, color: '#999', fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
