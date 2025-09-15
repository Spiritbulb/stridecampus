import { supabase } from '@/utils/supabaseClient';
import { Post, User } from '@/utils/supabaseClient';
import { Metadata } from 'next';

interface ProfileData {
  user: User;
  posts: Post[];
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  isFollowing?: boolean;
}

export async function fetchProfileData(username: string, currentUserId?: string): Promise<ProfileData | null> {
  try {
    // Fetch user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return null; // User not found
      }
      throw userError;
    }

    // Fetch user's posts with proper joins
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(full_name, avatar_url, checkmark, username, banner_url),
        space:spaces!posts_space_id_fkey(name, display_name)
      `)
      .eq('author_id', userData.id)
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    // For each post, fetch aggregated counts and user votes
    const processedPosts = await Promise.all((postsData || []).map(async (post) => {
      // Get vote count and user's vote
      const { data: voteData, error: voteError } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('post_id', post.id);

      if (voteError) console.error('Error fetching votes:', voteError);

      // Calculate vote count (upvotes - downvotes)
      const votes = voteData || [];
      const upvotes = votes.filter(v => v.vote_type === 1).length;
      const downvotes = votes.filter(v => v.vote_type === -1).length;
      const vote_count = upvotes - downvotes;

      // Get user's vote if currentUserId exists
      let user_vote = 0;
      if (currentUserId) {
        const userVote = votes.find(v => v.vote_type && currentUserId);
        // We need to fetch the actual user vote with user info
        const { data: userVoteData } = await supabase
          .from('post_votes')
          .select('vote_type')
          .eq('post_id', post.id)
          .eq('user_id', currentUserId)
          .single();
        
        user_vote = userVoteData?.vote_type || 0;
      }

      // Get comment count
      const { count: comment_count, error: commentError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      if (commentError) console.error('Error fetching comments count:', commentError);

      // Get share count
      const { count: share_count, error: shareError } = await supabase
        .from('post_shares')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      if (shareError) console.error('Error fetching shares count:', shareError);

      return {
        ...post,
        vote_count: vote_count || 0,
        comment_count: comment_count || 0,
        share_count: share_count || 0,
        user_vote: user_vote
      };
    }));

    // Fetch followers count
    const { count: followersCount, error: followersError } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', userData.id);

    if (followersError) throw followersError;

    // Fetch following count
    const { count: followingCount, error: followingError } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userData.id);

    if (followingError) throw followingError;

    const stats = {
      postsCount: processedPosts.length,
      followersCount: followersCount || 0,
      followingCount: followingCount || 0
    };

    // Check if current user is following this profile
    let isFollowing = false;
    if (currentUserId && currentUserId !== userData.id) {
      const { data: followData, error: followError } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('followed_id', userData.id)
        .single();

      // PGRST116 means no rows found, which is expected if not following
      if (followError && followError.code !== 'PGRST116') {
        console.error('Error checking follow status:', followError);
      }
      isFollowing = !!followData;
    }

    return {
      user: userData,
      posts: processedPosts,
      stats,
      isFollowing
    };
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const profileData = await fetchProfileData(params.slug);

  if (!profileData) {
    return {
      title: 'User Not Found',
    };
  }

  return {
    title: `${profileData.user.full_name} (@${profileData.user.username})`,
    description: profileData.user.bio || `Profile of ${profileData.user.full_name}`,
  };
}