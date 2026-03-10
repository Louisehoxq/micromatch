import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ApplicantDetail {
  id: string;
  job_id: string;
  jobber_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  estate: string;
  avatar_url: string | null;
  bio: string;
  available_slots: string[];
  skills: { name: string; proficiency: number }[];
}

interface Stats {
  total: number;
  reviewed: number;
  accepted: number;
}

export function useCreatorApplications(jobId: string) {
  const [applicants, setApplicants] = useState<ApplicantDetail[]>([]);
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

    // Fetch applications with all jobber details in one query
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select(`
        id, job_id, jobber_id, status, created_at, updated_at,
        profile:profiles!applications_jobber_id_fkey(
          full_name, estate, avatar_url,
          jobber_profiles(bio, available_slots),
          jobber_skills(proficiency, skill:skills(name))
        )
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (appError) {
      console.error('useCreatorApplications fetch error:', appError);
      setLoading(false);
      return;
    }

    const list: ApplicantDetail[] = (appData ?? []).map((row: any) => {
      const profile = row.profile ?? {};
      const jp = Array.isArray(profile.jobber_profiles)
        ? profile.jobber_profiles[0]
        : profile.jobber_profiles;

      const skills = (profile.jobber_skills ?? []).map((s: any) => ({
        name: s.skill?.name ?? '',
        proficiency: s.proficiency,
      }));

      return {
        id: row.id,
        job_id: row.job_id,
        jobber_id: row.jobber_id,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        full_name: profile.full_name ?? '',
        estate: profile.estate ?? '',
        avatar_url: profile.avatar_url ?? null,
        bio: jp?.bio ?? '',
        available_slots: jp?.available_slots ?? [],
        skills,
      };
    });

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
