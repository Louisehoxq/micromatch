import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { ApplicationWithJob } from '../types/database';

export function useApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('applications')
      .select('*, job:jobs!applications_job_id_fkey(title, estate, required_slots, status)')
      .eq('jobber_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setApplications(data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  async function applyToJob(jobId: string) {
    if (!user) return;
    const { error } = await supabase
      .from('applications')
      .insert({ job_id: jobId, jobber_id: user.id });
    if (error) throw error;
  }

  async function withdrawApplication(applicationId: string) {
    if (!user) return;
    const { error } = await supabase
      .from('applications')
      .update({ status: 'withdrawn_by_jobber' })
      .eq('id', applicationId)
      .eq('jobber_id', user.id);
    if (error) throw error;
    await fetchApplications();
  }

  return { applications, loading, applyToJob, withdrawApplication, refresh: fetchApplications };
}
