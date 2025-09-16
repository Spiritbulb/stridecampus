'use client';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabaseClient';
import { Comment } from '@/utils/supabaseClient';
import { LibraryFile } from '@/components/library/types';
import { 
  ArrowUp, 
  ArrowDown, 
  Reply, 
  MoreHorizontal, 
  FileText,
  X,
  Send
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import ResourceSelector from './ResourceSelector';

interface CommentComponentProps {
  comment: Comment;
  postId: string;
  onCommentAdded: () => void;
  depth?: number;
}

export default function CommentComponent({ 
  comment, 
  postId, 
  onCommentAdded, 
  depth = 0 
}: CommentComponentProps) {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResources, setSelectedResources] = useState<LibraryFile[]>([]);
  const [showResourceSelector, setShowResourceSelector] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [showReplies, setShowReplies] = useState(true);

  const handleVote = async (commentId: string, voteType: number) => {
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
        .from('comment_votes')
        .select('id, vote_type')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if clicking the same button again
          await supabase
            .from('comment_votes')
            .delete()
            .eq('id', existingVote.id);
        } else {
          // Update vote
          await supabase
            .from('comment_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
        }
      } else {
        // Create new vote
        await supabase
          .from('comment_votes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            vote_type: voteType
          });
      }

      // Refresh comment data
      onCommentAdded();
    } catch (error) {
      console.error('Error voting on comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to register vote',
        variant: 'destructive'
      });
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to reply',
        variant: 'destructive'
      });
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: 'Reply required',
        description: 'Please write a reply',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the reply
      const { data: reply, error: replyError } = await supabase
        .from('comments')
        .insert({
          content: replyContent,
          post_id: postId,
          author_id: user.id,
          parent_id: comment.id
        })
        .select(`
          *,
          author:users(full_name, avatar_url),
          vote_count:comment_votes(count),
          user_vote:comment_votes(vote_type),
          resource_tags:resource_tags(resource:files(*))
        `)
        .single();

      if (replyError) throw replyError;

      // Add resource tags if any
      if (selectedResources.length > 0) {
        const resourceTags = selectedResources.map(resource => ({
          comment_id: reply.id,
          resource_id: resource.id
        }));

        const { error: tagError } = await supabase
          .from('resource_tags')
          .insert(resourceTags);

        if (tagError) throw tagError;
      }

      // Process the reply data
      const processedReply = {
        ...reply,
        vote_count: reply.vote_count?.[0]?.count || 0,
        user_vote: reply.user_vote?.[0]?.vote_type || 0,
        resource_tags: reply.resource_tags?.map((rt: any) => rt.resource) || []
      };

      // Add to local state
      setReplies([...replies, processedReply]);
      
      // Clear form
      setReplyContent('');
      setSelectedResources([]);
      setIsReplying(false);

      toast({
        title: 'Success',
        description: 'Reply added'
      });

      // Notify parent to refresh counts
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

  const addResource = (resource: LibraryFile) => {
    if (!selectedResources.find(r => r.id === resource.id)) {
      setSelectedResources([...selectedResources, resource]);
    }
    setShowResourceSelector(false);
  };

  const removeResource = (resourceId: string) => {
    setSelectedResources(selectedResources.filter(r => r.id !== resourceId));
  };

  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users(full_name, avatar_url),
          vote_count:comment_votes(count),
          user_vote:comment_votes(vote_type),
          resource_tags:resource_tags(resource:files(*))
        `)
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const processedReplies = (data || []).map(reply => ({
        ...reply,
        vote_count: reply.vote_count?.[0]?.count || 0,
        user_vote: reply.user_vote?.[0]?.vote_type || 0,
        resource_tags: reply.resource_tags?.map((rt: any) => rt.resource) || []
      }));

      setReplies(processedReplies);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  // Load replies if not already loaded
  if (replies.length === 0 && comment.replies === undefined) {
    fetchReplies();
  }

  const maxDepth = 8; // Maximum nesting depth
  const shouldNest = depth < maxDepth;

  return (
    <div className={`${shouldNest ? 'pl-6' : ''}`}>
      <div className="border-l-2 border-gray-200 pl-4 py-2">
        {/* Comment header */}
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="font-medium text-gray-900">{comment.author?.full_name}</span>
          <span className="mx-1">•</span>
          <span>{formatDistanceToNow(new Date(comment.created_at))} ago</span>
        </div>

        {/* Comment content */}
        <div className="text-gray-800 mb-3 whitespace-pre-wrap">{comment.content}</div>

        {/* Resource tags */}
        {comment.resource_tags && comment.resource_tags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {comment.resource_tags.map(resource => (
                <a
                  key={resource.id}
                  href={`https://media.stridecampus.com/${resource.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200 transition-colors"
                >
                  <FileText size={12} />
                  <span className="truncate max-w-xs">{resource.original_name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Comment actions */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleVote(comment.id, 1)}
              className={`p-1 rounded hover:bg-gray-100 ${comment.user_vote === 1 ? 'text-[#f23b36]' : 'text-gray-500'}`}
            >
              <ArrowUp size={16} />
            </button>
            <span className="text-xs font-medium min-w-[1.5rem] text-center">{comment.vote_count}</span>
            <button
              onClick={() => handleVote(comment.id, -1)}
              className={`p-1 rounded hover:bg-gray-100 ${comment.user_vote === -1 ? 'text-blue-500' : 'text-gray-500'}`}
            >
              <ArrowDown size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 hover:text-gray-700"
          >
            <Reply size={16} />
            <span>Reply</span>
          </button>

          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showReplies ? 'Hide replies' : `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>

        {/* Reply form */}
        {isReplying && user && (
          <div className="mb-4 mt-2">
            <form onSubmit={handleReply} className="space-y-2">
              <div>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                  rows={2}
                  placeholder="Write a reply..."
                  disabled={isSubmitting}
                />
              </div>

              {/* Selected resources */}
              {selectedResources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedResources.map(resource => (
                    <div key={resource.id} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      <FileText size={12} />
                      <span className="truncate max-w-xs">{resource.original_name}</span>
                      <button
                        type="button"
                        onClick={() => removeResource(resource.id)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowResourceSelector(true)}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  <FileText size={14} />
                  Attach resource
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReplying(false)}
                    className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !replyContent.trim()}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-[#f23b36] text-white rounded-lg disabled:opacity-50"
                  >
                    <Send size={14} />
                    {isSubmitting ? 'Posting...' : 'Reply'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Nested replies */}
        {showReplies && replies.length > 0 && (
          <div className="space-y-3 mt-3">
            {replies.map(reply => (
              <CommentComponent
                key={reply.id}
                comment={reply}
                postId={postId}
                onCommentAdded={onCommentAdded}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Resource selector modal */}
      {showResourceSelector && (
        <ResourceSelector
          onSelect={addResource}
          onClose={() => setShowResourceSelector(false)}
          excludedResources={selectedResources.map(r => r.id)}
        />
      )}
    </div>
  );
}