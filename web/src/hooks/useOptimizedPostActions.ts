import { useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { User, Post } from '@/utils/supabaseClient';
import { toast } from '@/hooks/use-toast';

export const useOptimizedPostActions = (
  user: User | null, 
  updatePostOptimistically: (postId: string, updates: Partial<Post>) => void,
  refetch: () => void
) => {
  const handleVote = useCallback(async (postId: string, voteType: number) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to vote',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('post_votes')
        .select('id, vote_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      let optimisticVoteCount = 0;
      let optimisticUserVote = 0;

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if clicking the same button again
          optimisticVoteCount = -1;
          optimisticUserVote = 0;
          
          await supabase
            .from('post_votes')
            .delete()
            .eq('id', existingVote.id);
        } else {
          // Update vote (net change is 0 for vote count, but user vote changes)
          optimisticUserVote = voteType;
          
          await supabase
            .from('post_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
        }
      } else {
        // Create new vote
        optimisticVoteCount = 1;
        optimisticUserVote = voteType;
        
        await supabase
          .from('post_votes')
          .insert({
            post_id: postId,
            user_id: user.id,
            vote_type: voteType
          });
      }

      // Apply optimistic update
      // @ts-ignore
      updatePostOptimistically(postId, (post: Post) => {
        return {
          ...post,
          user_vote: optimisticUserVote,
          vote_count: Math.max(0, (post.vote_count || 0) + optimisticVoteCount)
        };
      });

    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to register vote',
        variant: 'destructive'
      });
      // Revert optimistic update by refetching
      refetch();
    }
  }, [user, updatePostOptimistically, refetch]);

  const handleShare = useCallback(async (postId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to share posts',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Note: We'll let the server handle share count updates for now

      // Record share
      await supabase
        .from('post_shares')
        .insert({
          post_id: postId,
          user_id: user.id
        });

      // Copy shareable link to clipboard
      const shareUrl = `${window.location.origin}/post/${postId}`;
      navigator.clipboard.writeText(shareUrl);

      toast({
        title: 'Success',
        description: 'Post link copied to clipboard'
      });
    } catch (error) {
      console.error('Error sharing post:', error);
      toast({
        title: 'Error',
        description: 'Failed to share post',
        variant: 'destructive'
      });
      // Revert optimistic update
      refetch();
    }
  }, [user, updatePostOptimistically, refetch]);

  const joinSpace = useCallback(async (spaceId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to join communities',
        variant: 'destructive'
      });
      return;
    }

    try {
      await supabase
        .from('space_memberships')
        .insert({
          space_id: spaceId,
          user_id: user.id,
          role: 'member'
        });

      // Refresh data for space membership changes
      refetch();
      
      toast({
        title: 'Success',
        description: 'You have joined this community'
      });
    } catch (error) {
      console.error('Error joining space:', error);
      toast({
        title: 'Error',
        description: 'Failed to join community',
        variant: 'destructive'
      });
    }
  }, [user, refetch]);

  return { handleVote, handleShare, joinSpace };
};
