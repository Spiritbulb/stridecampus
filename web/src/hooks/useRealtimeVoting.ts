'use client';
import { useEffect, useCallback, useState } from 'react';
import { supabase, type PostVote, type CommentVote } from '@/utils/supabaseClient';
import { useApp } from '@/contexts/AppContext';
import { useSupabaseUser } from './useSupabaseUser';

interface VoteUpdate {
  id: string;
  type: 'post' | 'comment';
  targetId: string; // post_id or comment_id
  userId: string;
  voteType: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
}

interface RealtimeVotingOptions {
  postId?: string;
  commentId?: string;
  onVoteUpdate?: (update: VoteUpdate) => void;
}

export function useRealtimeVoting(options: RealtimeVotingOptions = {}) {
  const { user: appUser } = useApp();
  const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  const { postId, commentId, onVoteUpdate } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [voteUpdates, setVoteUpdates] = useState<VoteUpdate[]>([]);

  const handleVoteChange = useCallback((
    payload: any,
    type: 'post' | 'comment',
    targetIdField: string
  ) => {
    const vote = payload.new || payload.old;
    const update: VoteUpdate = {
      id: vote.id,
      type,
      targetId: vote[targetIdField],
      userId: vote.user_id,
      voteType: vote.vote_type || 0,
      action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
    };

    console.log(`${type === 'post' ? '👍' : '💬👍'} Vote ${update.action.toLowerCase()}:`, update);
    
    setVoteUpdates(prev => [...prev.slice(-99), update]); // Keep last 100 updates
    
    if (onVoteUpdate) {
      onVoteUpdate(update);
    }
  }, [onVoteUpdate]);

  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    console.log('🔌 Setting up realtime voting subscriptions');
    let postVotesChannel: any = null;
    let commentVotesChannel: any = null;

    // Post votes subscription
    const postVotesChannelName = `post-votes-${postId || 'all'}`;
    postVotesChannel = supabase
      .channel(postVotesChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_votes',
          ...(postId && { filter: `post_id=eq.${postId}` })
        },
        (payload) => handleVoteChange(payload, 'post', 'post_id')
      )
      .subscribe((status) => {
        console.log(`📡 Post votes subscription status:`, status);
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Post votes realtime subscription failed. Check if realtime is enabled for post_votes table.');
        }
      });

    // Comment votes subscription
    const commentVotesChannelName = `comment-votes-${commentId || 'all'}`;
    commentVotesChannel = supabase
      .channel(commentVotesChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_votes',
          ...(commentId && { filter: `comment_id=eq.${commentId}` })
        },
        (payload) => handleVoteChange(payload, 'comment', 'comment_id')
      )
      .subscribe((status) => {
        console.log(`📡 Comment votes subscription status:`, status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Comment votes realtime subscription failed. Check if realtime is enabled for comment_votes table.');
        }
      });

    return () => {
      console.log('🧹 Cleaning up voting subscriptions');
      if (postVotesChannel) postVotesChannel.unsubscribe();
      if (commentVotesChannel) commentVotesChannel.unsubscribe();
      setIsConnected(false);
    };
  }, [user, postId, commentId, handleVoteChange]);

  const clearVoteUpdates = useCallback(() => {
    setVoteUpdates([]);
  }, []);

  return {
    isConnected,
    voteUpdates,
    clearVoteUpdates,
    latestUpdate: voteUpdates[voteUpdates.length - 1] || null
  };
}
