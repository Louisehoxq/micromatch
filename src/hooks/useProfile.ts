import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Profile, JobberProfile, JobberSkill } from '../types/database';
import { SelectedSkill } from '../components/SkillPicker';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobberProfile, setJobberProfile] = useState<JobberProfile | null>(null);
  const [jobberSkills, setJobberSkills] = useState<JobberSkill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(prof);

    if (prof?.role === 'jobber') {
      const [jpRes, jsRes] = await Promise.all([
        supabase.from('jobber_profiles').select('*').eq('id', user.id).single(),
        supabase.from('jobber_skills').select('*').eq('jobber_id', user.id),
      ]);
      setJobberProfile(jpRes.data);
      setJobberSkills(jsRes.data ?? []);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function updateProfile(updates: Partial<Pick<Profile, 'full_name' | 'estate' | 'avatar_url'>>) {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) throw error;
    await fetchProfile();
  }

  async function updateJobberProfile(
    updates: Partial<Pick<JobberProfile, 'date_of_birth' | 'bio' | 'hours_per_week' | 'available_days'>>
  ) {
    if (!user) return;
    const { error } = await supabase.from('jobber_profiles').update(updates).eq('id', user.id);
    if (error) throw error;
    await fetchProfile();
  }

  async function saveJobberSkills(skills: SelectedSkill[]) {
    if (!user) return;
    // Delete all existing, then insert new
    await supabase.from('jobber_skills').delete().eq('jobber_id', user.id);
    if (skills.length > 0) {
      const rows = skills.map(s => ({
        jobber_id: user.id,
        skill_id: s.skill_id,
        proficiency: s.proficiency,
      }));
      const { error } = await supabase.from('jobber_skills').insert(rows);
      if (error) throw error;
    }
    await fetchProfile();
  }

  return {
    profile,
    jobberProfile,
    jobberSkills,
    loading,
    updateProfile,
    updateJobberProfile,
    saveJobberSkills,
    refresh: fetchProfile,
  };
}
