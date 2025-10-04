// CreateModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Space } from '@/utils/supabaseClient';
import { LibraryFile } from '@/components/library/types';
import { X, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import PostForm from './PostForm';
import SpaceCreationWizard from './SpaceCreationWizard';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'post' | 'space';
  initialSpaceId?: string;
  onPostCreated?: () => void;
  onSpaceCreated?: (space: Space) => void;
}

type CreateMode = 'post' | 'space';

export default function CreateModal({
  isOpen,
  onClose,
  initialType = 'post',
  initialSpaceId,
  onPostCreated,
  onSpaceCreated
}: CreateModalProps) {
  const { user: appUser } = useApp();
  const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<CreateMode>(initialType);

  useEffect(() => {
    if (isOpen && user && appUser) {
      fetchSpaces();
    }
  }, [isOpen, user, appUser]);

  useEffect(() => {
    setMode(initialType);
  }, [initialType]);

  const fetchSpaces = async () => {
    if (!user || !appUser) return;
    
    try {
      setIsLoading(true);
      
      const { data: spacesData, error: spacesError } = await supabase
        .from('spaces')
        .select(`
          *,
          space_memberships (
            user_id,
            role
          )
        `)
        .eq('space_memberships.user_id', user?.id)
        .eq('is_public', true);

      if (spacesError) throw spacesError;

      setSpaces(spacesData || []);

      // Auto-join Stride Campus if it exists
      const strideSpace = spacesData?.find(space => space.name === 'stride');
      if (strideSpace) {
        const { data: membershipData } = await supabase
          .from('space_memberships')
          .select('*')
          .eq('space_id', strideSpace.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!membershipData) {
          await supabase
            .from('space_memberships')
            .insert({
              space_id: strideSpace.id,
              user_id: user.id,
              role: 'member'
            });

          toast({
            title: 'Welcome to Stride Campus!',
            description: 'You have been added to the default community.'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching spaces:', error);
      toast({
        title: 'Error',
        description: 'Failed to load communities',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = () => {
    onPostCreated?.();
    onClose();
    toast({
      title: 'Success',
      description: 'Your post has been created'
    });
  };

  const handleSpaceCreated = async (space: Space) => {
    await fetchSpaces(); // Refresh spaces list
    onSpaceCreated?.(space);
    setMode('post'); // Switch back to post creation
    toast({
      title: 'Success',
      description: `${space.name} created successfully`
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[120vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'post' ? 'What\'s up!' : 'New Space'}
            </h2>
            
            {/* 
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('post')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'post'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Post
              </button>
              <button
                onClick={() => setMode('space')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'space'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Space
              </button>
            </div>*/}
          </div> 
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f23b36]"></div>
            </div>
          ) : mode === 'post' ? (
            <PostForm
              spaces={spaces}
              initialSpaceId={initialSpaceId}
              onSuccess={handlePostCreated}
              onCreateSpace={() => setMode('space')}
            />
          ) : (
            <SpaceCreationWizard
              onSuccess={handleSpaceCreated}
              onCancel={() => setMode('post')}
            />
          )}
        </div>
      </div>
    </div>
  );
}