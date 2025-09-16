import { useState, useEffect } from 'react';
import { supabase, type LeaderboardEntry } from '@/utils/supabaseClient';

export function useLeaderboard(id: any) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLeaderboard();
    }
  }, [id]);

  const fetchLeaderboard = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          username,
          credits,
          avatar_url,
          school_name
        `)
        .eq('is_verified', true)
        .order('credits', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Transform data to match expected format
      const transformedData = (data || []).map((user, index) => ({
        name: user.full_name,
        username: user.username,
        credits: user.credits,
        school: user.school_name || 'Unknown School',
        avatar: user.avatar_url,
        position: index + 1,
        id: user.id
      }));

      const currentUserIndex = transformedData.findIndex(entry => entry.id === id);
      if (currentUserIndex !== -1) {
        transformedData[currentUserIndex].position = currentUserIndex + 1;
      }
      
      setLeaderboard(transformedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    leaderboard,
    loading,
    refetch: fetchLeaderboard
  };
}