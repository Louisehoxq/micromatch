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
      .select('*, job:jobs!applications_job_id_fkey(title, estate, hours_per_week, status)')
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

  return { applications, loading, applyToJob, refresh: fetchApplications };
}
