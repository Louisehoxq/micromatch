import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ApplicationWithJobber, ApplicationStatus } from '../types/database';

interface Stats {
  total: number;
  reviewed: number;
  accepted: number;
}

export function useCreatorApplications(jobId: string) {
  const [applicants, setApplicants] = useState<ApplicationWithJobber[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, reviewed: 0, accepted: 0 });

  const fetchApplicants = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);

    // Auto-promote pending → under_review when creator opens job
    await supabase
      .from('applications')
      .update({ status: 'under_review' })
      .eq('job_id', jobId)
      .eq('status', 'pending');

    const { data } = await supabase
      .from('applications')
      .select('*, jobber:profiles!applications_jobber_id_fkey(full_name, estate, avatar_url)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    const list = (data ?? []) as ApplicationWithJobber[];
    setApplicants(list);

    setStats({
      total: list.length,
      reviewed: list.filter(a => a.status !== 'pending').length,
      accepted: list.filter(a => a.status === 'accepted').length,
    });

    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  async function updateStatus(
    applicationId: string,
    status: 'accepted' | 'withdrawn_by_creator'
  ) {
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId);
    if (error) throw error;
    await fetchApplicants();
  }

  return { applicants, loading, stats, updateStatus, refresh: fetchApplicants };
}
