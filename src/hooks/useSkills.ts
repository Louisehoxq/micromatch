import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SkillCategory, Skill } from '../types/database';

export function useSkills() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [catRes, skillRes] = await Promise.all([
        supabase.from('skill_categories').select('*').order('display_order'),
        supabase.from('skills').select('*'),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (skillRes.data) setSkills(skillRes.data);
      setLoading(false);
    }
    fetch();
  }, []);

  return { categories, skills, loading };
}
