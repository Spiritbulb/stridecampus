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
        author:users!posts_author_id_fkey(full_name, avatar_url, checkmark, username),
        space:spaces(name, display_name, is_public),
        vote_count:post_votes(count),
        comment_count:comments(count),
        share_count:post_shares(count),
        user_vote:post_votes(vote_type),
        hashtags:post_hashtags(hashtag:hashtags(id, name)),
        mentions:post_mentions(mentioned_user:users!post_mentions_mentioned_user_id_fkey(id, username, full_name)),
        resource_tags:resource_tags(library:library(id, original_name, file_type, file_size))
      `);

    // Filter by space if selected
    if (selectedSpace !== 'all') {
      query = query.eq('space_id', selectedSpace);
    }

    // Apply proper sorting
    if (sortBy === 'hot') {
      // Hot posts: combination of votes and recent activity
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'top') {
      // Top posts: highest vote count
      query = query.order('vote_count', { ascending: false, referencedTable: 'post_votes' });
    } else {
      // Default: newest first
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
      user_vote: post.user_vote?.[0]?.vote_type || 0,
      hashtags: post.hashtags?.map((ht: any) => ht.hashtag) || [],
      mentions: post.mentions?.map((m: any) => m.mentioned_user) || [],
      resource_tags: post.resource_tags?.map((rt: any) => rt.library_file) || []
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};