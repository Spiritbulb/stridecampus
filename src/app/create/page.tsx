'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabaseClient';
import { Space, Post } from '@/utils/supabaseClient';
import { LibraryFile } from '@/components/library/types';
import { X, Link, FileText, Plus, Minus, Lock, Globe, ArrowLeft, ArrowRight, Upload, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import ResourceSelector from '@/components/feed/ResourceSelector';

function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    spaceId: '',
    isLinkPost: false,
    linkUrl: '',
    name: '',
    displayName: '',
    description: '',
    isPublic: true,
    logo: null as File | null
  });
  const [selectedResources, setSelectedResources] = useState<LibraryFile[]>([]);
  const [showResourceSelector, setShowResourceSelector] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [strideSpaceId, setStrideSpaceId] = useState<string | null>(null);
  const [userAddedToStride, setUserAddedToStride] = useState(false);

  const totalSteps = 4;

  useEffect(() => {
    // Check URL params to determine if we're creating a space or post
    const type = searchParams.get('type');
    if (type === 'space') {
      setIsCreatingSpace(true);
    } else if (type === 'post') {
      setIsCreatingSpace(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSpaces();
  }, [user]);

  const fetchSpaces = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch user's spaces
      const { data: spacesData, error: spacesError } = await supabase
        .from('spaces')
        .select(`
          *,
          space_memberships (
            user_id,
            role
          )
        `)
        .eq('space_memberships.user_id', user.id)
        .eq('is_public', true);

      if (spacesError) throw spacesError;

      setSpaces(spacesData || []);

      // Check if Stride Campus community exists
      const strideSpace = spacesData?.find(space => space.name === 'stride');
      
      if (strideSpace) {
        setStrideSpaceId(strideSpace.id);
        
        // Check if user is already a member of Stride Campus
        const { data: membershipData, error: membershipError } = await supabase
          .from('space_memberships')
          .select('*')
          .eq('space_id', strideSpace.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (membershipError) throw membershipError;

        // If user is not a member, add them automatically
        if (!membershipData) {
          const { error: joinError } = await supabase
            .from('space_memberships')
            .insert({
              space_id: strideSpace.id,
              user_id: user.id,
              role: 'member'
            });

          if (joinError) throw joinError;
          
          setUserAddedToStride(true);
          toast({
            title: 'Welcome to Stride Campus!',
            description: 'You have been added to the default community.'
          });
        }
      }

      // Set the default space to Stride Campus if it exists
      if (strideSpace) {
        setFormData(prev => ({ ...prev, spaceId: strideSpace.id }));
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

  const handlePostSubmit = async (e: React.FormEvent) => {
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

      // Redirect to feed page
      router.push('/feed');
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

  const handleSpaceSubmit = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a community',
        variant: 'destructive'
      });
      return;
    }

    // Validate name format (letters, numbers, underscores only)
    const nameRegex = /^[a-zA-Z0-9_]+$/;
    if (!nameRegex.test(formData.name)) {
      toast({
        title: 'Invalid name',
        description: 'Community name can only contain letters, numbers, and underscores',
        variant: 'destructive'
      });
      return;
    }

    if (formData.name.length < 3 || formData.name.length > 21) {
      toast({
        title: 'Invalid name length',
        description: 'Community name must be between 3 and 21 characters',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if space name already exists
      const { data: existingSpace, error: checkError } = await supabase
        .from('spaces')
        .select('id')
        .eq('name', formData.name)
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existingSpace) {
        toast({
          title: 'Name taken',
          description: 'A community with this name already exists',
          variant: 'destructive'
        });
        return;
      }

      // Create the space
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert({
          name: formData.name,
          display_name: formData.displayName || formData.name,
          description: formData.description,
          is_public: formData.isPublic,
          creator_id: user.id
        })
        .select()
        .single();

      if (spaceError) throw spaceError;

      // Add creator as admin
      const { error: membershipError } = await supabase
        .from('space_memberships')
        .insert({
          space_id: space.id,
          user_id: user.id,
          role: 'admin'
        });

      if (membershipError) throw membershipError;

      toast({
        title: 'Success',
        description: `Community ${formData.name} created successfully`
      });

      // Refresh spaces list
      await fetchSpaces();
      
      // Set the newly created space as selected
      setFormData(prev => ({ ...prev, spaceId: space.id }));
      
      // Switch back to post creation
      setIsCreatingSpace(false);
      setCurrentStep(1);
    } catch (error: any) {
      console.error('Error creating community:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create community',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSpaceSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setIsCreatingSpace(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.length >= 3 && formData.name.length <= 21 && /^[a-zA-Z0-9_]+$/.test(formData.name);
      case 2:
        return true; // Display name is optional
      case 3:
        return true; // Logo is optional
      case 4:
        return true; // Privacy selection always has a default
      default:
        return false;
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#f23b36] to-[#ff6b66] rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl text-white font-bold">C</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Choose your community name</h2>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                This will be your community's unique identifier. Choose something memorable!
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Community Name <span className="text-[#f23b36]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value.replace(/\s+/g, '_')})}
                  className="w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent transition-all"
                  placeholder="my_awesome_community"
                  required
                  minLength={3}
                  maxLength={21}
                  pattern="[a-zA-Z0-9_]+"
                />
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span className="text-gray-500">Letters, numbers, and underscores only</span>
                  <span className={`${formData.name.length > 18 ? 'text-[#f23b36]' : 'text-gray-400'}`}>
                    {formData.name.length}/21
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#f23b36] to-[#ff6b66] rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl text-white font-bold">✨</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Make it shine</h2>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                Add a display name and description to help people understand what your community is about.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent transition-all"
                  placeholder="My Awesome Community"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">This is how your community will appear to members</p>
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent transition-all resize-none"
                  rows={4}
                  placeholder="Tell people what makes your community special..."
                  maxLength={500}
                />
                <div className="mt-2 text-right">
                  <span className={`text-sm ${formData.description.length > 450 ? 'text-[#f23b36]' : 'text-gray-400'}`}>
                    {formData.description.length}/500
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#f23b36] to-[#ff6b66] rounded-full mx-auto flex items-center justify-center">
                <Camera className="text-white" size={28} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Add a community logo</h2>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                A great logo helps your community stand out and creates a sense of identity.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    {formData.logo ? (
                      <img 
                        src={URL.createObjectURL(formData.logo)} 
                        alt="Logo preview" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                        <span className="text-sm text-gray-500">Click to upload</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full p-3 border-2 border-[#f23b36] text-[#f23b36] rounded-lg hover:bg-[#f23b36] hover:text-white transition-all font-medium"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    {formData.logo ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFormData({...formData, logo: file});
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Recommended: Square image, at least 200x200px, PNG or JPG
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#f23b36] to-[#ff6b66] rounded-full mx-auto flex items-center justify-center">
                <Lock className="text-white" size={28} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Choose your privacy level</h2>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                Decide who can see and participate in your community.
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-4">
              <label className={`block p-6 border-2 rounded-lg cursor-pointer transition-all ${
                formData.isPublic 
                  ? 'border-[#f23b36] bg-[#f23b36]/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="privacy"
                  checked={formData.isPublic}
                  onChange={() => setFormData({...formData, isPublic: true})}
                  className="sr-only"
                />
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      formData.isPublic ? 'bg-[#f23b36]' : 'bg-gray-100'
                    }`}>
                      <Globe className={formData.isPublic ? 'text-white' : 'text-gray-400'} size={20} />
                    </div>
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Public Community</h3>
                    <p className="text-gray-600 mt-1">
                      Anyone can discover, view, and participate in your community. Great for building a large, open community.
                    </p>
                  </div>
                </div>
              </label>

              <label className={`block p-6 border-2 rounded-lg cursor-pointer transition-all ${
                !formData.isPublic 
                  ? 'border-[#f23b36] bg-[#f23b36]/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="privacy"
                  checked={!formData.isPublic}
                  onChange={() => setFormData({...formData, isPublic: false})}
                  className="sr-only"
                />
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      !formData.isPublic ? 'bg-[#f23b36]' : 'bg-gray-100'
                    }`}>
                      <Lock className={!formData.isPublic ? 'text-white' : 'text-gray-400'} size={20} />
                    </div>
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Private Community</h3>
                    <p className="text-gray-600 mt-1">
                      Only approved members can see and participate. Perfect for exclusive groups and sensitive discussions.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f23b36]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {!isCreatingSpace ? (
        // Post creation form
        <div className="bg-white rounded-lg w-full overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Create a post</h2>
            <button
              onClick={() => router.back()}
              className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handlePostSubmit} className="p-4 space-y-4">
            {/* Community selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Community
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.spaceId}
                  onChange={(e) => setFormData({...formData, spaceId: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
                  required
                >
                  <option value="">Select a community</option>
                  {spaces.map(space => (
                    <option key={space.id} value={space.id}>
                      {space.display_name || space.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingSpace(true)}
                  className="px-4 py-2 bg-[#f23b36] text-white rounded-md hover:shadow-md transition-all whitespace-nowrap"
                >
                  New Community
                </button>
              </div>
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
                onClick={() => router.back()}
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

          {/* Resource selector modal */}
          {showResourceSelector && (
            <ResourceSelector
              onSelect={addResource}
              onClose={() => setShowResourceSelector(false)}
              excludedResources={selectedResources.map(r => r.id)}
            />
          )}
        </div>
      ) : (
        // Space creation form
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {currentStep > 1 && (
                    <button
                      onClick={handleBack}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Create Community</h1>
                    <p className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreatingSpace(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-gray-200">
              <div 
                className="h-full bg-[#f23b36] transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-12">
            <div className="min-h-[60vh] flex items-center justify-center">
              {renderStepContent()}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200">
            <div className="px-6 py-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {currentStep === totalSteps ? 'Ready to create your community?' : 'Fill out the information above to continue'}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreatingSpace(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!canProceed() || isSubmitting}
                    className="px-6 py-3 bg-[#f23b36] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e12e29] transition-all font-medium flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <span>Creating...</span>
                    ) : (
                      <>
                        <span>{currentStep === totalSteps ? 'Create Community' : 'Continue'}</span>
                        {currentStep < totalSteps && <ArrowRight size={18} />}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreatePageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePage />
    </Suspense>
  );
}

export default CreatePageWithSuspense;