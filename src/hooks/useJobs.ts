import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Job, JobStatus } from '../types/database';
import { SelectedSkill } from '../components/SkillPicker';
import { DayOfWeek } from '../types/database';

interface CreateJobInput {
  title: string;
  description: string;
  estate: string;
  hours_per_week: number;
  required_days: DayOfWeek[];
  duration_weeks: number | null;
  skills: SelectedSkill[];
}

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<(Job & { applicant_count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('jobs')
      .select('*, applications(count)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setJobs(
        data.map((j: any) => ({
          ...j,
          applicant_count: j.applications?.[0]?.count ?? 0,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function createJob(input: CreateJobInput) {
    if (!user) return;

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        creator_id: user.id,
        title: input.title,
        description: input.description,
        estate: input.estate,
        hours_per_week: input.hours_per_week,
        required_days: input.required_days,
        duration_weeks: input.duration_weeks,
      })
      .select()
      .single();

    if (error) throw error;

    if (input.skills.length > 0 && job) {
      const rows = input.skills.map(s => ({
        job_id: job.id,
        skill_id: s.skill_id,
        min_proficiency: s.proficiency,
      }));
      const { error: skillErr } = await supabase.from('job_skills').insert(rows);
      if (skillErr) throw skillErr;
    }

    await fetchJobs();
    return job;
  }

  async function updateJobStatus(jobId: string, status: JobStatus) {
    const { error } = await supabase.from('jobs').update({ status }).eq('id', jobId);
    if (error) throw error;
    await fetchJobs();
  }

  return { jobs, loading, createJob, updateJobStatus, refresh: fetchJobs };
}
