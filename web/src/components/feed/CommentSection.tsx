'use client';
import React, { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Comment } from '@/utils/supabaseClient';
import { LibraryFile } from '@/components/library/types';
import { Send, FileText, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CommentComponent from './CommentComponent';
import ResourceSelector from './ResourceSelector';
import { useSafeApp } from '@/contexts/SafeAppContext';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  isLoading: boolean;
  onCommentAdded: () => void;
}

export default function CommentSection({ postId, comments, isLoading, onCommentAdded }: CommentSectionProps) {
  const { user } = useSafeApp();
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResources, setSelectedResources] = useState<LibraryFile[]>([]);
  const [showResourceSelector, setShowResourceSelector] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to comment',
        variant: 'destructive'
      });
      return;
    }

    if (!commentContent.trim()) {
      toast({
        title: 'Comment required',
        description: 'Please write a comment',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the comment
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert({
          content: commentContent,
          post_id: postId,
          author_id: user.id
        })
        .select()
        .single();

      if (commentError) throw commentError;

      // Add resource tags if any
      if (selectedResources.length > 0) {
        const resourceTags = selectedResources.map(resource => ({
          comment_id: comment.id,
          resource_id: resource.id
        }));

        const { error: tagError } = await supabase
          .from('resource_tags')
          .insert(resourceTags);

        if (tagError) throw tagError;
      }

      // Clear form
      setCommentContent('');
      setSelectedResources([]);

      toast({
        title: 'Success',
        description: 'Comment added'
      });

      onCommentAdded();
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f23b36]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Comment form */}
      {user ? (
        <div className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                rows={3}
                placeholder="What are your thoughts?"
                disabled={isSubmitting}
              />
            </div>

            {/* Selected resources */}
            {selectedResources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedResources.map(resource => (
                  <div key={resource.id} className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    <FileText size={14} />
                    <span className="truncate max-w-xs">{resource.original_name}</span>
                    <button
                      type="button"
                      onClick={() => removeResource(resource.id)}
                      className="text-blue-700 hover:text-blue-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowResourceSelector(true)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <Plus size={16} />
                Attach resource
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !commentContent.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-[#f23b36] text-white rounded-lg disabled:opacity-50 hover:shadow-md transition-all"
              >
                <Send size={16} />
                {isSubmitting ? 'Posting...' : 'Comment'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 bg-gray-100 rounded-lg text-center mb-6">
          <p className="text-gray-700">Please sign in to leave a comment</p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map(comment => (
            <CommentComponent
              key={comment.id}
              comment={comment}
              postId={postId}
              onCommentAdded={onCommentAdded}
            />
          ))
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