// hooks/useMemberCounts.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Space } from '@/utils/supabaseClient';

export const useMemberCounts = (spaces: Space[]) => {
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberCounts = async () => {
      if (!spaces || spaces.length === 0) {
        setLoading(false);
        return;
      }

      const counts: Record<string, number> = {};
      
      // Fetch counts for all spaces
      for (const space of spaces) {
        try {
          const { count, error } = await supabase
            .from('space_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('space_id', space.id);

          if (error) {
            console.error(`Error fetching member count for space ${space.id}:`, error);
            counts[space.id] = 0;
          } else {
            counts[space.id] = count || 0;
          }
        } catch (error) {
          console.error(`Error fetching member count for space ${space.id}:`, error);
          counts[space.id] = 0;
        }
      }

      setMemberCounts(counts);
      setLoading(false);
    };

    fetchMemberCounts();
  }, [spaces]);

  return { memberCounts, loading };
};