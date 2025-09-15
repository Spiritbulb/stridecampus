import { supabase } from '@/utils/supabaseClient';
import { User } from '@/utils/supabaseClient';
import { toast } from '@/hooks/use-toast';

export const usePostActions = (user: User | null, refetch: () => void) => {
  const handleVote = async (postId: string, voteType: number) => {
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

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if clicking the same button again
          await supabase
            .from('post_votes')
            .delete()
            .eq('id', existingVote.id);
        } else {
          // Update vote
          await supabase
            .from('post_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
        }
      } else {
        // Create new vote
        await supabase
          .from('post_votes')
          .insert({
            post_id: postId,
            user_id: user.id,
            vote_type: voteType
          });
      }
      
      // Refresh data
      refetch();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to register vote',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async (postId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to share posts',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Record share
      await supabase
        .from('post_shares')
        .insert({
          post_id: postId,
          user_id: user.id
        });

      // Refresh data
      refetch();

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
    }
  };

  const joinSpace = async (spaceId: string) => {
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

      // Refresh data
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
  };

  return { handleVote, handleShare, joinSpace };
};