import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { MatchedJob } from '../types/database';

export function useMatchedJobs() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchedJob[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase.rpc('get_matched_jobs', {
      p_jobber_id: user.id,
    });

    if (data) setMatches(data as MatchedJob[]);
    if (error) console.error('Match error:', error.message);
    setLoading(false);
  }, [user]);

  return { matches, loading, fetchMatches };
}
