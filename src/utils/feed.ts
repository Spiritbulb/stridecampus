import { supabase } from '@/utils/supabaseClient';
import { Post, Space } from '@/utils/supabaseClient';
import { User } from '@/utils/supabaseClient';

export const getMembersCount = async (spaceId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('space_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('space_id', spaceId);

    if (error) {
      console.error('Error fetching member count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Unexpected error:', error);
    return 0;
  }
};


export const fetchSpaces = async (user: User | null): Promise<Space[]> => {
  try {
    let query;

    if (user) {
      query = supabase
        .from('spaces')
        .select(`
          *,
          members_count:space_memberships(count),
          posts_count:posts(count),
          user_role:space_memberships!inner(role)
        `)
        .eq('space_memberships.user_id', user.id);
    } else {
      query = supabase
        .from('spaces')
        .select(`
          *,
          members_count:space_memberships(count),
          posts_count:posts(count)
        `)
        .eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching spaces:', error);
    throw error;
  }
};

export const fetchPosts = async (
  selectedSpace: string, 
  sortBy: string, 
  user: User | null
): Promise<Post[]> => {
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users(full_name, avatar_url, checkmark, username),
        space:spaces(name, display_name),
        vote_count:post_votes(count),
        comment_count:comments(count),
        share_count:post_shares(count),
        user_vote:post_votes(vote_type)
      `)
      .order('created_at', { ascending: false });

    // Filter by space if selected
    if (selectedSpace !== 'all') {
      query = query.eq('space_id', selectedSpace);
    }

    // Apply sorting
    if (sortBy === 'hot') {
      // Hot sorting logic (combination of votes and recent activity)
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'top') {
      // This would need a more complex query for top posts of all time
      query = query.order('created_at', { ascending: false });
    }

    // For non-logged in users, only show posts from public spaces
    if (!user) {
      query = query.eq('spaces.is_public', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Process the data to extract counts and user votes
    return (data || []).map(post => ({
      ...post,
      vote_count: post.vote_count?.[0]?.count || 0,
      comment_count: post.comment_count?.[0]?.count || 0,
      share_count: post.share_count?.[0]?.count || 0,
      user_vote: post.user_vote?.[0]?.vote_type || 0
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};