'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Comment } from '@/utils/supabaseClient';
import { LibraryFile } from '@/components/library/types';
import { 
  Heart,
  MessageCircle,
  MoreHorizontal,
  FileText,
  X,
  Trash2,
  Flag
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { useRealtimeVoting } from '@/hooks/useRealtimeVoting';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

interface CommentComponentProps {
  comment: Comment;
  postId: string;
  onCommentAdded: () => void;
  depth?: number;
}

// Format time to short format
const formatTimeShort = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) return `${diffSecs}s`;
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${diffWeeks}w`;
};

export default function CommentComponent({ 
  comment, 
  postId, 
  onCommentAdded, 
  depth = 0 
}: CommentComponentProps) {
  const { user: appUser } = useApp();
const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [showReplies, setShowReplies] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.user_vote === 1);
  const [likeCount, setLikeCount] = useState(comment.vote_count || 0);

  const isOwner = user && comment.author_id === user?.id;

  // Fetch accurate vote count on mount
  useEffect(() => {
    const fetchVoteCount = async () => {
      try {
        const { count, error } = await supabase
          .from('comment_votes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id)
          .eq('vote_type', 1);

        if (error) throw error;
        
        if (count !== null) {
          setLikeCount(count);
        }
      } catch (error) {
        console.error('Error fetching vote count:', error);
      }
    };

    fetchVoteCount();
  }, [comment.id]);

  // Set up realtime voting for this comment
  const { isConnected } = useRealtimeVoting({
    commentId: comment.id,
    onVoteUpdate: (update) => {
      // Only update if this is for our comment and is a comment vote
      if (update.targetId !== comment.id || update.type !== 'comment') {
        return;
      }

      console.log('🔄 Realtime vote update for comment:', comment.id, update);
      
      // Update vote count and user's vote state
      if (update.action === 'INSERT') {
        setLikeCount(prev => prev + 1);
        if (update.userId === user?.id) {
          setIsLiked(true);
        }
      } else if (update.action === 'DELETE') {
        setLikeCount(prev => Math.max(0, prev - 1));
        if (update.userId === user?.id) {
          setIsLiked(false);
        }
      } else if (update.action === 'UPDATE') {
        // Handle vote type changes if needed
        if (update.userId === user?.id) {
          setIsLiked(update.voteType === 1);
        }
      }
    }
  });

  const handleLike = async () => {
    if (!user || !appUser) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to like',
        variant: 'destructive'
      });
      return;
    }

    const newLikeState = !isLiked;
    const previousLikeState = isLiked;
    const previousCount = likeCount;
    
    // Optimistic update
    setIsLiked(newLikeState);
    setLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));

    try {
      const { data: existingVote } = await supabase
        .from('comment_votes')
        .select('id')
        .eq('comment_id', comment.id)
        .eq('user_id', user?.id)
        .single();

      if (existingVote) {
        const { error } = await supabase
          .from('comment_votes')
          .delete()
          .eq('id', existingVote.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comment_votes')
          .insert({
            comment_id: comment.id,
            user_id: user?.id,
            vote_type: 1
          });
        
        if (error) throw error;
      }

      // Fetch actual count after operation to ensure accuracy
      const { count, error: countError } = await supabase
        .from('comment_votes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', comment.id)
        .eq('vote_type', 1);

      if (!countError && count !== null) {
        setLikeCount(count);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousLikeState);
      setLikeCount(previousCount);
      console.error('Error liking comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive'
      });
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !replyContent.trim()) return;

    setIsSubmitting(true);

    try {
      // Insert the reply
      const { data: reply, error } = await supabase
        .from('comments')
        .insert({
          content: replyContent,
          post_id: postId,
          author_id: user?.id,
          parent_id: comment.id
        })
        .select(`
          *,
          author:users(full_name, avatar_url, username, checkmark)
        `)
        .single();

      if (error) throw error;

      // Fetch accurate vote count for the new reply
      const { count: voteCount } = await supabase
        .from('comment_votes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', reply.id)
        .eq('vote_type', 1);

      // Check if current user has voted
      const { data: userVote } = await supabase
        .from('comment_votes')
        .select('vote_type')
        .eq('comment_id', reply.id)
        .eq('user_id', user?.id)
        .single();

      const processedReply = {
        ...reply,
        vote_count: voteCount || 0,
        user_vote: userVote?.vote_type || 0,
        resource_tags: []
      };

      setReplies([...replies, processedReply]);
      setReplyContent('');
      setIsReplying(false);
      setShowReplies(true);

      onCommentAdded();
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reply',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;

      toast({
        title: 'Comment deleted'
      });

      onCommentAdded();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive'
      });
    }
  };

  const maxDepth = 3;
  const canNest = depth < maxDepth;

  return (
    <div className={`${canNest && depth > 0 ? 'ml-10' : ''}`}>
      <div className="flex gap-3 py-3">
        {/* Avatar */}
        <img 
          src={comment.author?.avatar_url || '/default-avatar.png'} 
          alt="Avatar" 
          className="w-8 h-8 rounded-full object-cover flex-shrink-0" 
        />
        
        <div className="flex-1 min-w-0">
          {/* Comment content */}
          <div className="mb-2">
            <span className="font-semibold text-sm mr-2 flex items-center gap-1">
              {comment.author?.full_name || 'Anonymous'}
              {comment.author?.checkmark && <img src="/check.png" alt="Checkmark" className="w-4 h-4" />}
            </span>
            <span className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {comment.content}
            </span>
          </div>

          {/* Resource tags */}
          {comment.resource_tags && comment.resource_tags.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-1">
                {comment.resource_tags.map(resource => (
                  <a
                    key={resource.id}
                    href={`https://media.stridecampus.com/${resource.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                  >
                    <FileText size={10} />
                    <span className="truncate max-w-[150px]">{resource.original_name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{formatTimeShort(new Date(comment.created_at))}</span>
            
            {likeCount > 0 && (
              <button className="font-semibold hover:text-gray-700">
                {likeCount} {likeCount === 1 ? 'like' : 'likes'}
              </button>
            )}
            
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="font-semibold hover:text-gray-700"
            >
              Reply
            </button>

            {isOwner && (
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="hover:text-gray-700"
                >
                  <MoreHorizontal size={14} />
                </button>
                
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute left-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={handleDelete}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Reply input */}
          {isReplying && (
            <form onSubmit={handleReply} className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Add a reply..."
                className="flex-1 text-sm px-0 py-1 border-0 border-b border-gray-300 focus:outline-none focus:border-gray-400"
                disabled={isSubmitting}
                autoFocus
              />
              <button
                type="submit"
                disabled={isSubmitting || !replyContent.trim()}
                className="text-sm font-semibold text-blue-500 hover:text-blue-600 disabled:opacity-50"
              >
                Post
              </button>
              <button
                type="button"
                onClick={() => setIsReplying(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </form>
          )}

          {/* View replies button */}
          {replies.length > 0 && !showReplies && (
            <button
              onClick={() => setShowReplies(true)}
              className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              <div className="w-6 h-px bg-gray-300" />
              View {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}

          {/* Nested replies */}
          {showReplies && replies.length > 0 && (
            <div className="mt-3">
              {replies.map(reply => (
                <CommentComponent
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onCommentAdded={onCommentAdded}
                  depth={depth + 1}
                />
              ))}
              <button
                onClick={() => setShowReplies(false)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700 mt-2"
              >
                <div className="w-6 h-px bg-gray-300" />
                Hide replies
              </button>
            </div>
          )}
        </div>

        {/* Like button */}
        <button
          onClick={handleLike}
          className="flex-shrink-0 self-start mt-1"
        >
          <Heart 
            size={12} 
            className={isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
          />
        </button>
      </div>
    </div>
  );
}