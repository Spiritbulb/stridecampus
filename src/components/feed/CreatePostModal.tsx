'use client';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabaseClient';
import { Space } from '@/utils/supabaseClient';
import { LibraryFile } from '@/app/library/page';
import { X, Link, FileText, Plus, Minus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ResourceSelector from './ResourceSelector';

interface CreatePostModalProps {
  spaces: Space[];
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({ spaces, onClose, onPostCreated }: CreatePostModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    spaceId: '',
    isLinkPost: false,
    linkUrl: ''
  });
  const [selectedResources, setSelectedResources] = useState<LibraryFile[]>([]);
  const [showResourceSelector, setShowResourceSelector] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a post',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.spaceId) {
      toast({
        title: 'Community required',
        description: 'Please select a community for your post',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          title: formData.title,
          content: formData.content,
          space_id: formData.spaceId,
          author_id: user.id,
          is_link_post: formData.isLinkPost,
          link_url: formData.isLinkPost ? formData.linkUrl : null
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add resource tags if any
      if (selectedResources.length > 0) {
        const resourceTags = selectedResources.map(resource => ({
          post_id: post.id,
          resource_id: resource.id
        }));

        const { error: tagError } = await supabase
          .from('resource_tags')
          .insert(resourceTags);

        if (tagError) throw tagError;
      }

      toast({
        title: 'Success',
        description: 'Your post has been created'
      });

      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
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

  return (
    <div className="fixed inset-0 flex backdrop-blur items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Create a post</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Community selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Community
            </label>
            <select
              value={formData.spaceId}
              onChange={(e) => setFormData({...formData, spaceId: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
              required
            >
              <option value="">Select a community</option>
              {spaces.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          {/* Post title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
              placeholder="Enter post title"
              required
              maxLength={300}
            />
          </div>

          {/* Post content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content (optional)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
              rows={4}
              placeholder="What would you like to share?"
            />
          </div>

          {/* Link post toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isLinkPost"
              checked={formData.isLinkPost}
              onChange={(e) => setFormData({...formData, isLinkPost: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="isLinkPost" className="text-sm font-medium text-gray-700">
              This is a link post
            </label>
          </div>

          {/* Link URL */}
          {formData.isLinkPost && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link URL
              </label>
              <div className="flex items-center">
                <Link size={16} className="text-gray-500 mr-2" />
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
                  placeholder="https://example.com"
                  required={formData.isLinkPost}
                />
              </div>
            </div>
          )}

          {/* Resource tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Attach resources (optional)
              </label>
              <button
                type="button"
                onClick={() => setShowResourceSelector(true)}
                className="flex items-center gap-1 text-sm text-[#f23b36] hover:underline"
              >
                <Plus size={16} />
                Add resource
              </button>
            </div>

            {selectedResources.length > 0 && (
              <div className="space-y-2">
                {selectedResources.map(resource => (
                  <div key={resource.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-500" />
                      <span className="text-sm">{resource.original_name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeResource(resource.id)}
                      className="p-1 text-gray-500 hover:text-red-500 rounded"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#f23b36] text-white rounded-md disabled:opacity-50 hover:shadow-md transition-all"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
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