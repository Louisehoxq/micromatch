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
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../src/lib/supabase';

function formatSlot(slot: string): string {
  const [day, period] = slot.split('_');
  const short: Record<string, string> = { morning: 'AM', afternoon: 'PM', evening: 'Eve' };
  return `${day} ${short[period] ?? period}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-SG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface ContractData {
  id: string;
  terms: string;
  creator_signed_at: string | null;
  jobber_signed_at: string | null;
}

interface CommitmentData {
  status: string;
  updated_at: string;
  contract: ContractData | null;
  job: {
    title: string;
    description: string;
    estate: string;
    required_slots: string[];
    duration_weeks: number;
    remuneration_per_hour_min: number | null;
    remuneration_per_hour_max: number | null;
    creator_name: string;
    contact_number: string | null;
  };
}

export default function CommitmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<CommitmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetchCommitment();
  }, [id]);

  async function fetchCommitment() {
    setLoading(true);
    const [{ data: row, error }, { data: contractRow }] = await Promise.all([
      supabase
        .from('applications')
        .select(`
          id, status, updated_at,
          job:jobs(
            title, description, estate, required_slots, duration_weeks,
            remuneration_per_hour_min, remuneration_per_hour_max,
            creator:profiles!jobs_creator_id_fkey(
              full_name,
              creator_profile:creator_profiles(contact_number)
            )
          )
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('contracts')
        .select('id, terms, creator_signed_at, jobber_signed_at')
        .eq('application_id', id)
        .maybeSingle(),
    ]);

    if (error || !row) {
      setLoading(false);
      return;
    }

    const job = row.job as any;
    const creator = Array.isArray(job?.creator) ? job.creator[0] : job?.creator;
    const creatorProfile = Array.isArray(creator?.creator_profile)
      ? creator.creator_profile[0]
      : creator?.creator_profile;

    setData({
      status: row.status,
      updated_at: row.updated_at,
      contract: contractRow ?? null,
      job: {
        title: job?.title ?? '',
        description: job?.description ?? '',
        estate: job?.estate ?? '',
        required_slots: job?.required_slots ?? [],
        duration_weeks: job?.duration_weeks ?? 0,
        remuneration_per_hour_min: job?.remuneration_per_hour_min ?? null,
        remuneration_per_hour_max: job?.remuneration_per_hour_max ?? null,
        creator_name: creator?.full_name ?? '',
        contact_number: creatorProfile?.contact_number ?? null,
      },
    });
    setLoading(false);
  }

  async function handleSign() {
    setActing(true);

    if (data?.contract?.id) {
      const { error: contractErr } = await supabase
        .from('contracts')
        .update({ jobber_signed_at: new Date().toISOString() })
        .eq('id', data.contract.id);
      if (contractErr) {
        Alert.alert('Error', contractErr.message);
        setActing(false);
        return;
      }
    }

    const { error } = await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', id);
    if (error) {
      Alert.alert('Error', error.message);
      setActing(false);
      return;
    }
    await fetchCommitment();
    setActing(false);
  }

  async function handleDecline() {
    Alert.alert(
      'Decline Offer',
      'Are you sure you want to decline this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setActing(true);
            const { error } = await supabase
              .from('applications')
              .update({ status: 'withdrawn_by_jobber' })
              .eq('id', id);
            if (error) {
              Alert.alert('Error', error.message);
              setActing(false);
              return;
            }
            router.back();
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

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Commitment not found</Text>
      </View>
    );
  }

  const { job } = data;
  const isOfferPending = data.status === 'offer_pending';
  const hoursPerWeek = job.required_slots.length * 3;
  const confirmedDate = new Date(data.updated_at).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const hasRemuneration =
    job.remuneration_per_hour_min != null || job.remuneration_per_hour_max != null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status banner */}
      {isOfferPending ? (
        <View style={styles.offerBanner}>
          <Ionicons name="mail-open" size={32} color="#b45309" />
          <View style={styles.bannerText}>
            <Text style={styles.offerBannerTitle}>Offer Received</Text>
            <Text style={styles.offerBannerSub}>
              {job.creator_name} has offered you this position. Review the details below and sign to confirm.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.committedBanner}>
          <Ionicons name="checkmark-circle" size={32} color="#27ae60" />
          <View style={styles.bannerText}>
            <Text style={styles.committedBannerTitle}>Offer Accepted</Text>
            <Text style={styles.committedBannerDate}>Confirmed on {confirmedDate}</Text>
            <Text style={styles.committedBannerSub}>You are committed to this job.</Text>
          </View>
        </View>
      )}

      {/* Job header */}
      <View style={styles.section}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.jobMeta}>
          {job.estate} · {hoursPerWeek} hrs/week{job.duration_weeks ? ` · ${job.duration_weeks} weeks` : ''}
        </Text>
      </View>

      {/* Remuneration */}
      {hasRemuneration && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remuneration</Text>
          <Text style={styles.remunerationText}>
            ${job.remuneration_per_hour_min ?? '?'}–${job.remuneration_per_hour_max ?? '?'}/hr
          </Text>
        </View>
      )}

      {/* About the Job */}
      {!!job.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Job</Text>
          <Text style={styles.bodyText}>{job.description}</Text>
        </View>
      )}

      {/* Posted by */}
      {!!job.creator_name && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posted by</Text>
          <Text style={styles.bodyText}>{job.creator_name}</Text>
          {!!job.contact_number && (
            <Text style={styles.contactText}>{job.contact_number}</Text>
          )}
        </View>
      )}

      {/* Contract */}
      {data.contract && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contract</Text>
          <View style={styles.contractBox}>
            <Text style={styles.contractText}>{data.contract.terms}</Text>
          </View>

          {/* Signature timestamps — shown after both parties have signed */}
          {!isOfferPending && (
            <View style={styles.signaturesBox}>
              {data.contract.creator_signed_at && (
                <Text style={styles.signatureRow}>
                  Signed by employer: {formatDate(data.contract.creator_signed_at)}
                </Text>
              )}
              {data.contract.jobber_signed_at && (
                <Text style={styles.signatureRow}>
                  Signed by you: {formatDate(data.contract.jobber_signed_at)}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Signing actions — only shown when offer is pending */}
      {isOfferPending && (
        <>
          {/* Agreement checkbox — required before signing if a contract exists */}
          {data.contract && (
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed(prev => !prev)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I have read and agree to the contract terms above
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.signBtn,
                (acting || (!!data.contract && !agreed)) && styles.btnDisabled,
              ]}
              onPress={handleSign}
              disabled={acting || (!!data.contract && !agreed)}
            >
              <Ionicons name="pencil" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.signBtnText}>{acting ? 'Signing…' : 'Sign & Accept Offer'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn, acting && styles.btnDisabled]}
              onPress={handleDecline}
              disabled={acting}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#999' },

  offerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  offerBannerTitle: { fontSize: 17, fontWeight: '700', color: '#92400e' },
  offerBannerSub: { fontSize: 13, color: '#b45309', marginTop: 4, lineHeight: 18 },

  committedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  bannerText: { flex: 1 },
  committedBannerTitle: { fontSize: 17, fontWeight: '700', color: '#166534' },
  committedBannerDate: { fontSize: 13, color: '#27ae60', marginTop: 2 },
  committedBannerSub: { fontSize: 13, color: '#4ade80', marginTop: 2 },

  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  jobTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  jobMeta: { fontSize: 14, color: '#666' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  remunerationText: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  bodyText: { fontSize: 15, color: '#444', lineHeight: 22 },
  contactText: { fontSize: 15, color: '#4361ee', marginTop: 4 },

  contractBox: {
    backgroundColor: '#f8f9ff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e4f5',
    marginBottom: 12,
  },
  contractText: { fontSize: 12, color: '#333', lineHeight: 19, fontFamily: 'monospace' },
  signaturesBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  signatureRow: { fontSize: 12, color: '#166534' },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4361ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  checkboxLabel: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  actions: { gap: 12, marginTop: 8 },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signBtn: { backgroundColor: '#27ae60' },
  signBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  declineBtn: {
    borderWidth: 1.5,
    borderColor: '#e63946',
  },
  declineBtnText: { fontSize: 16, fontWeight: '600', color: '#e63946' },
  btnDisabled: { opacity: 0.6 },
});
