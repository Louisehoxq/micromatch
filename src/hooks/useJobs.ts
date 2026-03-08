import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Job, JobStatus, TimeSlot } from '../types/database';
import { SelectedSkill } from '../components/SkillPicker';

interface CreateJobInput {
  title: string;
  description: string;
  estate: string;
  requiredSlots: TimeSlot[];
  duration_weeks: number | null;
  skills: SelectedSkill[];
  remuneration_per_hour_min?: number | null;
  remuneration_per_hour_max?: number | null;
  photos?: string[];
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
        required_slots: input.requiredSlots,
        duration_weeks: input.duration_weeks,
        remuneration_per_hour_min: input.remuneration_per_hour_min ?? null,
        remuneration_per_hour_max: input.remuneration_per_hour_max ?? null,
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

    if (input.photos && input.photos.length > 0 && job) {
      const photoRows = input.photos.map((url, index) => ({
        job_id: job.id,
        photo_url: url,
        display_order: index,
      }));
      const { error: photoErr } = await supabase.from('job_photos').insert(photoRows);
      if (photoErr) throw photoErr;
    }

    await fetchJobs();
    return job;
  }

  async function updateJob(jobId: string, input: Omit<CreateJobInput, 'skills'> & { skills: SelectedSkill[] }) {
    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        title: input.title,
        description: input.description,
        estate: input.estate,
        required_slots: input.requiredSlots,
        duration_weeks: input.duration_weeks,
        remuneration_per_hour_min: input.remuneration_per_hour_min ?? null,
        remuneration_per_hour_max: input.remuneration_per_hour_max ?? null,
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;

    // Replace skills
    await supabase.from('job_skills').delete().eq('job_id', jobId);
    if (input.skills.length > 0) {
      const rows = input.skills.map(s => ({
        job_id: jobId,
        skill_id: s.skill_id,
        min_proficiency: s.proficiency,
      }));
      const { error: skillErr } = await supabase.from('job_skills').insert(rows);
      if (skillErr) throw skillErr;
    }

    // Replace photos
    await supabase.from('job_photos').delete().eq('job_id', jobId);
    if (input.photos && input.photos.length > 0) {
      const photoRows = input.photos.map((url, index) => ({
        job_id: jobId,
        photo_url: url,
        display_order: index,
      }));
      const { error: photoErr } = await supabase.from('job_photos').insert(photoRows);
      if (photoErr) throw photoErr;
    }

    await fetchJobs();
    return job;
  }

  async function updateJobStatus(jobId: string, status: JobStatus) {
    const { error } = await supabase.from('jobs').update({ status }).eq('id', jobId);
    if (error) throw error;
    await fetchJobs();
  }

  return { jobs, loading, createJob, updateJob, updateJobStatus, refresh: fetchJobs };
}
