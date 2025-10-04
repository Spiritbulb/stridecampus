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
      // Get all public spaces and spaces the user created
      query = supabase
        .from('spaces')
        .select('*')
        .or(`is_public.eq.true,creator_id.eq.${user.id}`);
    } else {
      query = supabase
        .from('spaces')
        .select('*')
        .eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get member and post counts, and user membership for each space
    const spacesWithCounts = await Promise.all(
      (data || []).map(async (space) => {
        const [membersResult, postsResult, userMembershipResult] = await Promise.all([
          supabase
            .from('space_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('space_id', space.id),
          supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('space_id', space.id),
          user ? supabase
            .from('space_memberships')
            .select('role')
            .eq('space_id', space.id)
            .eq('user_id', user.id)
            .maybeSingle() : Promise.resolve({ data: null, error: null })
        ]);

        // Determine user role - creator is always admin, otherwise check membership
        let userRole = undefined;
        if (user) {
          if (space.creator_id === user.id) {
            userRole = 'admin';
          } else if (userMembershipResult.data) {
            userRole = userMembershipResult.data.role;
          }
        }

        return {
          ...space,
          members_count: membersResult.count || 0,
          posts_count: postsResult.count || 0,
          user_role: userRole,
          is_joined: !!userRole
        };
      })
    );

    return spacesWithCounts;
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
        hashtags:post_hashtags(hashtag:hashtags(id, name)),
        mentions:post_mentions(mentioned_user:users!post_mentions_mentioned_user_id_fkey(id, username, full_name)),
        resource_tags:resource_tags(library:library(id, original_name, file_type, file_size))
      `);

    // Handle different space selections
    if (selectedSpace === 'following' && user) {
      // For following feed, get posts from spaces the user is a member of
      const { data: memberSpaces } = await supabase
        .from('space_memberships')
        .select('space_id')
        .eq('user_id', user.id);
      
      if (memberSpaces && memberSpaces.length > 0) {
        const spaceIds = memberSpaces.map(m => m.space_id);
        query = query.in('space_id', spaceIds);
      } else {
        // User isn't following any spaces, return empty array
        return [];
      }
    } else if (selectedSpace !== 'all') {
      // selectedSpace is a specific space UUID
      query = query.eq('space_id', selectedSpace);
    }
    // If selectedSpace is 'all', don't filter by space

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

    // Get manual counts for each post
    const postsWithCounts = await Promise.all(
      (data || []).map(async (post) => {
        const [votesResult, commentsResult, sharesResult, userVoteResult] = await Promise.all([
          supabase
            .from('post_votes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id),
          supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id),
          supabase
            .from('post_shares')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id),
          user ? supabase
            .from('post_votes')
            .select('vote_type')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle() : Promise.resolve({ data: null, error: null })
        ]);

        return {
          ...post,
          vote_count: votesResult.count || 0,
          comment_count: commentsResult.count || 0,
          share_count: sharesResult.count || 0,
          user_vote: userVoteResult.data?.vote_type || 0,
          hashtags: post.hashtags?.map((ht: any) => ht.hashtag) || [],
          mentions: post.mentions?.map((m: any) => m.mentioned_user) || [],
          resource_tags: post.resource_tags?.map((rt: any) => rt.library) || [] // Fixed: was rt.library_file
        };
      })
    );

    return postsWithCounts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};