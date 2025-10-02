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
  Shield,
  Camera,
  Upload
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(space.logo_url || '');
  const [formData, setFormData] = useState({
    display_name: space.display_name,
    description: space.description || '',
    is_public: space.is_public,
  });

  const uploadLogoToR2 = async (file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const consistentFilename = `space_logo_${space.id}.${fileExtension}`;
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('filename', consistentFilename);
    formDataUpload.append('metadata', JSON.stringify({
      userId: 'space-admin',
      subject: 'space-logo',
      description: `Logo for space: ${space.display_name}`,
      tags: `space,logo,${space.id}`,
      spaceId: space.id,
      spaceName: space.display_name
    }));

    const response = await fetch('https://api.stridecampus.com/upload', {
      method: 'POST',
      body: formDataUpload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const result = await response.json();
    
    // API returns: { success: true, data: { filename, originalName, ... } }
    //@ts-ignore
    if (result.success && result.data?.filename) {
      // Construct the full URL from the filename
      //@ts-ignore
      return `https://media.stridecampus.com/${result.data.filename}`;
    }
    
    //@ts-ignore
    throw new Error(result.error || 'Upload failed');
  };

  const deleteLogoFromR2 = async (logoUrl: string): Promise<void> => {
    try {
      const filename = logoUrl.split('/').pop();
      if (!filename) return;

      await fetch(`https://api.stridecampus.com/files/${filename}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Error deleting old logo:', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a valid image (JPEG, PNG, GIF, WebP)',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeLogo = async () => {
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
      
      if (space.logo_url) {
        await deleteLogoFromR2(space.logo_url);
      }

      const { data, error } = await supabase
        .from('spaces')
        .update({
          logo_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', space.id)
        .select()
        .single();

      if (error) throw error;

      setLogoFile(null);
      setLogoPreview('');
      onSpaceUpdate?.(data);
      
      toast({
        title: 'Logo removed',
        description: 'Space logo has been removed'
      });
    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove logo',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (currentUserRole !== 'admin') {
      toast({
        title: 'Permission Denied',
        description: 'Only admins can modify space settings',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.display_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Display name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      let logoUrl = space.logo_url;
      
      if (logoFile) {
        const oldLogoUrl = space.logo_url;
        logoUrl = await uploadLogoToR2(logoFile);
        
        if (oldLogoUrl && oldLogoUrl !== logoUrl) {
          await deleteLogoFromR2(oldLogoUrl);
        }
      }

      const { data, error } = await supabase
        .from('spaces')
        .update({
          display_name: formData.display_name.trim(),
          description: formData.description.trim() || null,
          is_public: formData.is_public,
          logo_url: logoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', space.id)
        .select()
        .single();

      if (error) throw error;

      onSpaceUpdate?.(data);
      setLogoFile(null);
      setLogoPreview(data.logo_url || '');
      
      toast({
        title: 'Settings saved',
        description: 'Space settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating space:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update space settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLogoClick = () => {
    if (logoFile) {
      setLogoFile(null);
      setLogoPreview(space.logo_url || '');
    } else if (logoPreview) {
      removeLogo();
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
      
      await supabase.from('space_memberships').delete().eq('space_id', space.id);
      await supabase.from('posts').delete().eq('space_id', space.id);
      
      const { error } = await supabase.from('spaces').delete().eq('id', space.id);
      if (error) throw error;

      if (space.logo_url) {
        await deleteLogoFromR2(space.logo_url);
      }

      toast({
        title: 'Space deleted',
        description: 'Space has been permanently deleted'
      });

      window.location.href = '/spaces';
    } catch (error) {
      console.error('Error deleting space:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete space',
        variant: 'destructive'
      });
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (currentUserRole !== 'admin') {
    return (
      <div className="text-center py-16 px-4">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-sm text-gray-500">Only space admins can access settings</p>
      </div>
    );
  }

  const hasChanges = logoFile || 
    formData.display_name !== space.display_name ||
    formData.description !== (space.description || '') ||
    formData.is_public !== space.is_public;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Space Settings</h2>
          <p className="text-xs text-gray-500">Manage your space configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={hasChanges ? 'Save changes' : 'No changes to save'}
        >
          <Save className="w-5 h-5 text-[#f23b36]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Space Logo</label>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Space logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 cursor-pointer transition-all group">
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={isLoading}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                {logoFile ? logoFile.name : 'Change your space logo'}
              </p>
              <div className="flex gap-2">
                <label className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-xs font-semibold cursor-pointer">
                  {isLoading ? 'Uploading...' : 'Change'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                </label>
                {logoPreview && (
                  <button
                    onClick={handleRemoveLogoClick}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full hover:bg-red-100 transition-colors text-xs font-semibold disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f23b36] text-sm disabled:bg-gray-50"
            placeholder="Enter space display name"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            disabled={isLoading}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f23b36] text-sm disabled:bg-gray-50 resize-none"
            placeholder="Describe your space..."
            maxLength={500}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Visibility
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="visibility"
                checked={formData.is_public}
                onChange={() => setFormData(prev => ({ ...prev, is_public: true }))}
                disabled={isLoading}
                className="w-4 h-4 text-[#f23b36] focus:ring-[#f23b36]"
              />
              <Globe className="w-4 h-4 ml-3 mr-2 text-green-600" />
              <div className="flex-1">
                <span className="font-medium text-sm">Public</span>
                <p className="text-xs text-gray-500">Anyone can discover and join</p>
              </div>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="visibility"
                checked={!formData.is_public}
                onChange={() => setFormData(prev => ({ ...prev, is_public: false }))}
                disabled={isLoading}
                className="w-4 h-4 text-[#f23b36] focus:ring-[#f23b36]"
              />
              <Lock className="w-4 h-4 ml-3 mr-2 text-red-600" />
              <div className="flex-1">
                <span className="font-medium text-sm">Private</span>
                <p className="text-xs text-gray-500">Invite only</p>
              </div>
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          className="w-full px-4 py-2.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-red-900 mb-3">Danger Zone</h3>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 text-sm mb-1">Delete Space</h4>
                <p className="text-xs text-red-700">
                  Permanently delete this space and all its content. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors text-xs font-semibold flex-shrink-0 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Space</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{space.display_name}"? This will permanently remove:
            </p>
            
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1 ml-2">
              <li>All posts and comments</li>
              <li>All member data</li>
              <li>Space settings and configuration</li>
            </ul>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSpace}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-semibold"
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