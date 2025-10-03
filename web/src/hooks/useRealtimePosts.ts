'use client';
import { useEffect, useCallback, useRef } from 'react';
import { supabase, type Post, type PostVote, type CommentVote } from '@/utils/supabaseClient';
import { useApp } from '@/contexts/AppContext';

interface RealtimePostsOptions {
  spaceId?: string;
  postId?: string;
  onPostCreated?: (post: Post) => void;
  onPostUpdated?: (post: Post) => void;
  onPostDeleted?: (postId: string) => void;
  onPostVoteChanged?: (vote: PostVote) => void;
  onCommentVoteChanged?: (vote: CommentVote) => void;
  onCommentCreated?: (comment: any) => void;
  onCommentDeleted?: (commentId: string) => void;
}

export function useRealtimePosts(options: RealtimePostsOptions = {}) {
  const { user } = useApp();
  const channelsRef = useRef<Map<string, any>>(new Map());
  const {
    spaceId,
    postId,
    onPostCreated,
    onPostUpdated,
    onPostDeleted,
    onPostVoteChanged,
    onCommentVoteChanged,
    onCommentCreated,
    onCommentDeleted
  } = options;

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up realtime post subscriptions');
    channelsRef.current.forEach((channel, key) => {
      console.log(`Unsubscribing from channel: ${key}`);
      channel.unsubscribe();
    });
    channelsRef.current.clear();
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) {
      cleanup();
      return;
    }

    console.log('🔌 Setting up realtime post subscriptions for user:', user.id);

    // 1. Posts subscription
    const postsChannelKey = `posts-${spaceId || 'all'}`;
    const postsChannel = supabase
      .channel(postsChannelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          ...(spaceId && { filter: `space_id=eq.${spaceId}` })
        },
        (payload) => {
          console.log('📝 New post created:', payload.new);
          if (onPostCreated) {
            onPostCreated(payload.new as Post);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          ...(spaceId && { filter: `space_id=eq.${spaceId}` })
        },
        (payload) => {
          console.log('📝 Post updated:', payload.new);
          if (onPostUpdated) {
            onPostUpdated(payload.new as Post);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts',
          ...(spaceId && { filter: `space_id=eq.${spaceId}` })
        },
        (payload) => {
          console.log('📝 Post deleted:', payload.old);
          if (onPostDeleted) {
            onPostDeleted(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Posts subscription status (${postsChannelKey}):`, status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Posts realtime subscription failed. Check if realtime is enabled for posts table.');
        }
      });

    channelsRef.current.set(postsChannelKey, postsChannel);

    // 2. Post votes subscription
    const postVotesChannelKey = `post-votes-${postId || 'all'}`;
    const postVotesChannel = supabase
      .channel(postVotesChannelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_votes',
          ...(postId && { filter: `post_id=eq.${postId}` })
        },
        (payload) => {
          console.log('👍 Post vote changed:', payload);
          if (onPostVoteChanged) {
            const vote = payload.new || payload.old;
            onPostVoteChanged(vote as PostVote);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Post votes subscription status (${postVotesChannelKey}):`, status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Post votes realtime subscription failed. Check if realtime is enabled for post_votes table.');
        }
      });

    channelsRef.current.set(postVotesChannelKey, postVotesChannel);

    // 3. Comment votes subscription
    const commentVotesChannelKey = `comment-votes-${postId || 'all'}`;
    const commentVotesChannel = supabase
      .channel(commentVotesChannelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_votes'
        },
        (payload) => {
          console.log('💬👍 Comment vote changed:', payload);
          if (onCommentVoteChanged) {
            const vote = payload.new || payload.old;
            onCommentVoteChanged(vote as CommentVote);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Comment votes subscription status (${commentVotesChannelKey}):`, status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Comment votes realtime subscription failed. Check if realtime is enabled for comment_votes table.');
        }
      });

    channelsRef.current.set(commentVotesChannelKey, commentVotesChannel);

    // 4. Comments subscription (if postId is provided)
    if (postId) {
      const commentsChannelKey = `comments-${postId}`;
      const commentsChannel = supabase
        .channel(commentsChannelKey)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments',
            filter: `post_id=eq.${postId}`
          },
          (payload) => {
            console.log('💬 New comment created:', payload.new);
            if (onCommentCreated) {
              onCommentCreated(payload.new);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'comments',
            filter: `post_id=eq.${postId}`
          },
          (payload) => {
            console.log('💬 Comment deleted:', payload.old);
            if (onCommentDeleted) {
              onCommentDeleted(payload.old.id);
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 Comments subscription status (${commentsChannelKey}):`, status);
          if (status === 'CHANNEL_ERROR') {
            console.error('❌ Comments realtime subscription failed. Check if realtime is enabled for comments table.');
          }
        });

      channelsRef.current.set(commentsChannelKey, commentsChannel);
    }

    return cleanup;
  }, [user, spaceId, postId, onPostCreated, onPostUpdated, onPostDeleted, onPostVoteChanged, onCommentVoteChanged, onCommentCreated, onCommentDeleted, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isConnected: channelsRef.current.size > 0,
    activeChannels: Array.from(channelsRef.current.keys()),
    cleanup
  };
}

