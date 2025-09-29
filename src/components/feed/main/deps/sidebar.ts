// hooks/useSpaceCounts.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Space } from '@/utils/supabaseClient';

export const useMemberCounts = (spaces: Space[]) => {
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpaceCounts = async () => {
      if (!spaces || spaces.length === 0) {
        setLoading(false);
        return;
      }

      const memberCounts: Record<string, number> = {};
      const postCounts: Record<string, number> = {};
      
      // Fetch counts for all spaces
      for (const space of spaces) {
        try {
          const [membersResult, postsResult] = await Promise.all([
            supabase
              .from('space_memberships')
              .select('*', { count: 'exact', head: true })
              .eq('space_id', space.id),
            supabase
              .from('posts')
              .select('*', { count: 'exact', head: true })
              .eq('space_id', space.id)
          ]);

          if (membersResult.error) {
            console.error(`Error fetching member count for space ${space.id}:`, membersResult.error);
            memberCounts[space.id] = 0;
          } else {
            memberCounts[space.id] = membersResult.count || 0;
          }

          if (postsResult.error) {
            console.error(`Error fetching post count for space ${space.id}:`, postsResult.error);
            postCounts[space.id] = 0;
          } else {
            postCounts[space.id] = postsResult.count || 0;
          }
        } catch (error) {
          console.error(`Error fetching counts for space ${space.id}:`, error);
          memberCounts[space.id] = 0;
          postCounts[space.id] = 0;
        }
      }

      setMemberCounts(memberCounts);
      setPostCounts(postCounts);
      setLoading(false);
    };

    fetchSpaceCounts();
  }, [spaces]);

  return { memberCounts, postCounts, loading };
};