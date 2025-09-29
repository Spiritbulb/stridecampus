'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Space } from '@/utils/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  Lock, 
  Save, 
  Trash2,
  AlertTriangle,
  Shield
} from 'lucide-react';

interface SpaceSettingsProps {
  space: Space;
  currentUserRole?: string;
  onSpaceUpdate?: (updatedSpace: Space) => void;
}

export default function SpaceSettings({ 
  space, 
  currentUserRole, 
  onSpaceUpdate 
}: SpaceSettingsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    display_name: space.display_name,
    description: space.description || '',
    is_public: space.is_public,
    allow_member_posts: true,
    require_approval: false,
    max_members: 1000
  });

  const handleSave = async () => {
    if (currentUserRole !== 'admin') {
      toast({
        title: 'Permission Denied',
        description: 'Only admins can modify space settings',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('spaces')
        .update({
          display_name: formData.display_name,
          description: formData.description || null,
          is_public: formData.is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', space.id)
        .select()
        .single();

      if (error) throw error;

      onSpaceUpdate?.(data);
      
      toast({
        title: 'Success',
        description: 'Space settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating space:', error);
      toast({
        title: 'Error',
        description: 'Failed to update space settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSpace = async () => {
    if (currentUserRole !== 'admin') {
      toast({
        title: 'Permission Denied',
        description: 'Only admins can delete spaces',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Delete space memberships first
      await supabase
        .from('space_memberships')
        .delete()
        .eq('space_id', space.id);

      // Delete space posts
      await supabase
        .from('posts')
        .delete()
        .eq('space_id', space.id);

      // Delete the space
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', space.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Space deleted successfully'
      });

      // Redirect to spaces page
      window.location.href = '/spaces';
    } catch (error) {
      console.error('Error deleting space:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete space',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (currentUserRole !== 'admin') {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">Only space admins can access settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Space Settings</h2>
          <p className="text-gray-600 text-sm">Manage your space configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Basic Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter space display name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your space..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.is_public}
                  onChange={() => setFormData(prev => ({ ...prev, is_public: true }))}
                  className="mr-2"
                />
                <Globe className="w-4 h-4 mr-2 text-green-600" />
                <span>Public - Anyone can discover and join</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  checked={!formData.is_public}
                  onChange={() => setFormData(prev => ({ ...prev, is_public: false }))}
                  className="mr-2"
                />
                <Lock className="w-4 h-4 mr-2 text-red-600" />
                <span>Private - Invite only</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Allow Member Posts</h4>
              <p className="text-sm text-gray-600">Let members create posts in this space</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_member_posts}
                onChange={(e) => setFormData(prev => ({ ...prev, allow_member_posts: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Require Post Approval</h4>
              <p className="text-sm text-gray-600">Posts need admin/moderator approval before being visible</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.require_approval}
                onChange={(e) => setFormData(prev => ({ ...prev, require_approval: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h4 className="font-medium text-red-900">Delete Space</h4>
              <p className="text-sm text-red-700">
                Permanently delete this space and all its content. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Space
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Space</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{space.display_name}"? This will permanently remove:
            </p>
            
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>All posts and comments</li>
              <li>All member data</li>
              <li>Space settings and configuration</li>
            </ul>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSpace}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete Space'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}