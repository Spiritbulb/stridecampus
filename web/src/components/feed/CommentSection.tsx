'use client';
import React, { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Comment } from '@/utils/supabaseClient';
import { LibraryFile } from '@/components/library/types';
import { Smile, FileText, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CommentComponent from './CommentComponent';
import ResourceSelector from './ResourceSelector';
import { useApp } from '@/contexts/AppContext';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  isLoading: boolean;
  onCommentAdded: () => void;
}

export default function CommentSection({ postId, comments, isLoading, onCommentAdded }: CommentSectionProps) {
  const { user: appUser } = useApp();
const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResources, setSelectedResources] = useState<LibraryFile[]>([]);
  const [showResourceSelector, setShowResourceSelector] = useState(false);

  const handleSubmit = async () => {
    if (!user || !appUser) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to comment',
        variant: 'destructive'
      });
      return;
    }

    if (!commentContent.trim()) return;

    setIsSubmitting(true);

    try {
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert({
          content: commentContent,
          post_id: postId,
          author_id: user?.id
        })
        .select()
        .single();

      if (commentError) throw commentError;

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

      setCommentContent('');
      setSelectedResources([]);

      toast({
        title: 'Comment added'
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
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm mb-1 font-semibold">No comments yet</p>
            <p className="text-gray-400 text-xs">Start the conversation.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map(comment => (
              <CommentComponent
                key={comment.id}
                comment={comment}
                postId={postId}
                onCommentAdded={onCommentAdded}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment input - Fixed at bottom */}
      {user && appUser ? (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          {/* Selected resources */}
          {selectedResources.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {selectedResources.map(resource => (
                <div key={resource.id} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                  <FileText size={10} />
                  <span className="truncate max-w-[100px]">{resource.original_name}</span>
                  <button
                    onClick={() => removeResource(resource.id)}
                    className="text-blue-700 hover:text-blue-900"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowResourceSelector(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FileText size={20} />
            </button>

            <input
              type="text"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Add a comment..."
              className="flex-1 text-sm px-0 py-1 border-0 focus:outline-none focus:ring-0"
              disabled={isSubmitting}
            />

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !commentContent.trim()}
              className="text-sm font-semibold text-blue-500 hover:text-blue-600 disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-200 bg-white px-4 py-3 text-center">
          <p className="text-sm text-gray-500">
            Please sign in to comment
          </p>
        </div>
      )}

      {/* Resource Selector Modal */}
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