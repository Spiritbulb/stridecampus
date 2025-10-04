'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Space, Post } from '@/utils/supabaseClient';
import { LibraryFile } from '@/components/library/types';
import { X, Link, FileText, Plus, Minus, Lock, Globe, ArrowLeft, ArrowRight, Upload, Camera, Type, AlignLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import ResourceSelector from '@/components/feed/ResourceSelector';
import { useApp } from '@/contexts/AppContext';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

function CreatePage() {
  const { user: appUser } = useApp();
const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [contentElements, setContentElements] = useState<Array<{id: string, type: 'text' | 'paragraph', content: string}>>([
    { id: '1', type: 'text', content: '' }
  ]);
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

  // Update formData.content when contentElements change
  useEffect(() => {
    const combinedContent = contentElements
      .map(element => element.content)
      .filter(content => content.trim())
      .join('\n\n');
    setFormData(prev => ({ ...prev, content: combinedContent }));
  }, [contentElements]);

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

  const addContentElement = (type: 'text' | 'paragraph') => {
    const newElement = {
      id: Date.now().toString(),
      type,
      content: ''
    };
    setContentElements([...contentElements, newElement]);
  };

  const updateContentElement = (id: string, content: string) => {
    setContentElements(elements =>
      elements.map(el => el.id === id ? { ...el, content } : el)
    );
  };

  const removeContentElement = (id: string) => {
    if (contentElements.length > 1) {
      setContentElements(elements => elements.filter(el => el.id !== id));
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
          library_id: resource.id
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
          <div className="text-center space-y-12">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#f23b36] to-[#ff6b66] rounded-full mx-auto flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white font-bold">C</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900">Choose your community name</h2>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                This will be your community's unique identifier. Choose something memorable!
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-8">
              <div className="space-y-2">
                <label className="text-gray-900 text-sm font-semibold block text-left">
                  Community Name <span className="text-[#f23b36]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value.replace(/\s+/g, '_')})}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent px-0 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none transition-all duration-300 border-b-2"
                    style={{ 
                      borderBottomColor: focusedField === 'name' ? '#f23b36' : '#e5e7eb'
                    }}
                    placeholder="my_awesome_community"
                    required
                    minLength={3}
                    maxLength={21}
                    pattern="[a-zA-Z0-9_]+"
                  />
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
                    style={{ 
                      backgroundColor: '#f23b36',
                      width: focusedField === 'name' ? '100%' : '0%'
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
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
          <div className="text-center space-y-12">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#f23b36] to-[#ff6b66] rounded-full mx-auto flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white font-bold">✨</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900">Make it shine</h2>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                Add a display name and description to help people understand what your community is about.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-8">
              <div className="space-y-2">
                <label className="text-gray-900 text-sm font-semibold block text-left">
                  Display Name <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    onFocus={() => setFocusedField('displayName')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent px-0 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none transition-all duration-300 border-b-2"
                    style={{ 
                      borderBottomColor: focusedField === 'displayName' ? '#f23b36' : '#e5e7eb'
                    }}
                    placeholder="My Awesome Community"
                    maxLength={100}
                  />
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
                    style={{ 
                      backgroundColor: '#f23b36',
                      width: focusedField === 'displayName' ? '100%' : '0%'
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-left">This is how your community will appear to members</p>
              </div>

              <div className="space-y-2">
                <label className="text-gray-900 text-sm font-semibold block text-left">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent px-0 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none transition-all duration-300 border-b-2 resize-none"
                    style={{ 
                      borderBottomColor: focusedField === 'description' ? '#f23b36' : '#e5e7eb'
                    }}
                    rows={4}
                    placeholder="Tell people what makes your community special..."
                    maxLength={500}
                  />
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
                    style={{ 
                      backgroundColor: '#f23b36',
                      width: focusedField === 'description' ? '100%' : '0%'
                    }}
                  />
                </div>
                <div className="flex justify-end">
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
          <div className="text-center space-y-12">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#f23b36] to-[#ff6b66] rounded-full mx-auto flex items-center justify-center shadow-lg">
                <Camera className="text-white" size={28} />
              </div>
              <h2 className="text-4xl font-bold text-gray-900">Add a community logo</h2>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                A great logo helps your community stand out and creates a sense of identity.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="space-y-8">
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

                <div className="space-y-4">
                  <button
                    type="button"
                    className="w-full py-4 px-6 rounded-2xl font-semibold text-lg text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                    style={{ backgroundColor: '#f23b36' }}
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
          <div className="text-center space-y-12">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#f23b36] to-[#ff6b66] rounded-full mx-auto flex items-center justify-center shadow-lg">
                <Lock className="text-white" size={28} />
              </div>
              <h2 className="text-4xl font-bold text-gray-900">Choose your privacy level</h2>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                Decide who can see and participate in your community.
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-4">
              <label className={`block p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                formData.isPublic 
                  ? 'border-[#f23b36] bg-[#f23b36]/5 shadow-lg' 
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

              <label className={`block p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                !formData.isPublic 
                  ? 'border-[#f23b36] bg-[#f23b36]/5 shadow-lg' 
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f23b36]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <button 
        onClick={() => router.back()}
        className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110 rounded-full hover:bg-gray-50 p-2 z-50"
      >
        <ArrowLeft size={24} />
      </button>

      {!isCreatingSpace ? (
        // Post creation form - AuthScreen inspired design
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md relative z-10">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-gray-900">
                  Create a post
                </h2>
                <p className="text-gray-600 text-lg">
                  Share your thoughts with the community
                </p>
              </div>
            </div>

            <form onSubmit={handlePostSubmit} className="space-y-8">
              {/* Community selection */}
              <div className="space-y-2">
                <label className="text-gray-900 text-sm font-semibold block">
                  Community <span className="text-[#f23b36]">*</span>
                </label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <select
                      value={formData.spaceId}
                      onChange={(e) => setFormData({...formData, spaceId: e.target.value})}
                      onFocus={() => setFocusedField('spaceId')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full bg-transparent px-0 py-4 text-gray-900 text-lg focus:outline-none transition-all duration-300 border-b-2 appearance-none"
                      style={{ 
                        borderBottomColor: focusedField === 'spaceId' ? '#f23b36' : '#e5e7eb'
                      }}
                      required
                    >
                      <option value="">Select a community</option>
                      {spaces.map(space => (
                        <option key={space.id} value={space.id}>
                          {space.display_name || space.name}
                        </option>
                      ))}
                    </select>
                    <div 
                      className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
                      style={{ 
                        backgroundColor: '#f23b36',
                        width: focusedField === 'spaceId' ? '100%' : '0%'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreatingSpace(true)}
                    className="px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg whitespace-nowrap"
                    style={{ backgroundColor: '#f23b36' }}
                  >
                    New
                  </button>
                </div>
              </div>

              {/* Post title */}
              <div className="space-y-2">
                <label className="text-gray-900 text-sm font-semibold block">
                  Title <span className="text-[#f23b36]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    onFocus={() => setFocusedField('title')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent px-0 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none transition-all duration-300 border-b-2"
                    style={{ 
                      borderBottomColor: focusedField === 'title' ? '#f23b36' : '#e5e7eb'
                    }}
                    placeholder="Enter post title"
                    required
                    maxLength={300}
                  />
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
                    style={{ 
                      backgroundColor: '#f23b36',
                      width: focusedField === 'title' ? '100%' : '0%'
                    }}
                  />
                </div>
                <div className="flex justify-end">
                  <span className={`text-sm ${formData.title.length > 250 ? 'text-[#f23b36]' : 'text-gray-400'}`}>
                    {formData.title.length}/300
                  </span>
                </div>
              </div>

              {/* Content Elements */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-gray-900 text-sm font-semibold block">
                    Content <span className="text-gray-400">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addContentElement('text')}
                      className="flex items-center gap-1 text-sm text-[#f23b36] hover:text-[#e12e29] transition-colors"
                    >
                      <Type size={16} />
                      <span>Text</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addContentElement('paragraph')}
                      className="flex items-center gap-1 text-sm text-[#f23b36] hover:text-[#e12e29] transition-colors"
                    >
                      <AlignLeft size={16} />
                      <span>Paragraph</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {contentElements.map((element, index) => (
                    <div key={element.id} className="relative group">
                      {element.type === 'text' ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={element.content}
                            onChange={(e) => updateContentElement(element.id, e.target.value)}
                            onFocus={() => setFocusedField(`content-${element.id}`)}
                            onBlur={() => setFocusedField(null)}
                            className="w-full bg-transparent px-0 py-3 text-gray-900 text-base placeholder-gray-400 focus:outline-none transition-all duration-300 border-b border-gray-200"
                            style={{ 
                              borderBottomColor: focusedField === `content-${element.id}` ? '#f23b36' : '#e5e7eb'
                            }}
                            placeholder="Add a line of text..."
                          />
                          <div 
                            className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
                            style={{ 
                              backgroundColor: '#f23b36',
                              width: focusedField === `content-${element.id}` ? '100%' : '0%'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <textarea
                            value={element.content}
                            onChange={(e) => updateContentElement(element.id, e.target.value)}
                            onFocus={() => setFocusedField(`content-${element.id}`)}
                            onBlur={() => setFocusedField(null)}
                            className="w-full bg-transparent px-0 py-3 text-gray-900 text-base placeholder-gray-400 focus:outline-none transition-all duration-300 border-b border-gray-200 resize-none"
                            style={{ 
                              borderBottomColor: focusedField === `content-${element.id}` ? '#f23b36' : '#e5e7eb'
                            }}
                            rows={3}
                            placeholder="Write a paragraph..."
                          />
                          <div 
                            className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
                            style={{ 
                              backgroundColor: '#f23b36',
                              width: focusedField === `content-${element.id}` ? '100%' : '0%'
                            }}
                          />
                        </div>
                      )}
                      
                      {contentElements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContentElement(element.id)}
                          className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all"
                        >
                          <Minus size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Link post toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isLinkPost"
                  checked={formData.isLinkPost}
                  onChange={(e) => setFormData({...formData, isLinkPost: e.target.checked})}
                  className="w-4 h-4 text-[#f23b36] bg-gray-100 border-gray-300 rounded focus:ring-[#f23b36] focus:ring-2"
                />
                <label htmlFor="isLinkPost" className="text-gray-900 font-medium">
                  This is a link post
                </label>
              </div>

              {/* Link URL */}
              {formData.isLinkPost && (
                <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                  <label className="text-gray-900 text-sm font-semibold block">
                    Link URL <span className="text-[#f23b36]">*</span>
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <Link size={16} className="text-gray-400 mr-3" />
                      <input
                        type="url"
                        value={formData.linkUrl}
                        onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                        onFocus={() => setFocusedField('linkUrl')}
                        onBlur={() => setFocusedField(null)}
                        className="flex-1 bg-transparent px-0 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none transition-all duration-300 border-b-2"
                        style={{ 
                          borderBottomColor: focusedField === 'linkUrl' ? '#f23b36' : '#e5e7eb'
                        }}
                        placeholder="https://example.com"
                        required={formData.isLinkPost}
                      />
                    </div>
                    <div 
                      className="absolute bottom-0 left-8 h-0.5 transition-all duration-300 transform origin-left"
                      style={{ 
                        backgroundColor: '#f23b36',
                        width: focusedField === 'linkUrl' ? 'calc(100% - 2rem)' : '0%'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Resource tags */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-gray-900 text-sm font-semibold">
                    Attach resources <span className="text-gray-400">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowResourceSelector(true)}
                    className="flex items-center gap-1 text-sm text-[#f23b36] hover:text-[#e12e29] transition-colors font-medium"
                  >
                    <Plus size={16} />
                    Add resource
                  </button>
                </div>

                {selectedResources.length > 0 && (
                  <div className="space-y-3">
                    {selectedResources.map(resource => (
                      <div key={resource.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#f23b36]/10 rounded-full flex items-center justify-center">
                            <FileText size={16} className="text-[#f23b36]" />
                          </div>
                          <span className="text-gray-900 font-medium">{resource.original_name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeResource(resource.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form actions */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-4 text-gray-600 rounded-2xl font-semibold hover:text-gray-900 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim() || !formData.spaceId}
                  className="flex-1 py-4 px-6 rounded-2xl font-semibold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105 hover:shadow-lg group"
                  style={{ backgroundColor: '#f23b36' }}
                >
                  <span>{isSubmitting ? 'Creating post...' : 'Create Post'}</span>
                  {!isSubmitting && <ArrowRight size={18} className="inline ml-2 group-hover:translate-x-1 transition-transform duration-300" />}
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
        </div>
      ) : (
        // Space creation form - Existing design with AuthScreen styling improvements
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-2xl relative z-10">
            {/* Progress indicator */}
            <div className="flex justify-center mb-12">
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative">
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        i <= currentStep ? 'scale-125' : 'scale-100'
                      }`}
                      style={{ 
                        backgroundColor: i <= currentStep ? '#f23b36' : '#e5e7eb'
                      }}
                    />
                    {i <= currentStep && (
                      <div 
                        className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-30"
                        style={{ backgroundColor: '#f23b36' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="min-h-[60vh] flex items-center justify-center">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-12">
              <div className="text-sm text-gray-500">
                {currentStep === totalSteps ? 'Ready to create your community?' : 'Fill out the information above to continue'}
              </div>
              <div className="flex space-x-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-8 py-4 text-gray-600 rounded-2xl font-semibold hover:text-gray-900 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="px-8 py-4 rounded-2xl font-semibold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105 hover:shadow-lg group flex items-center gap-3"
                  style={{ backgroundColor: '#f23b36' }}
                >
                  {isSubmitting ? (
                    <span>Creating...</span>
                  ) : (
                    <>
                      <span>{currentStep === totalSteps ? 'Create Community' : 'Continue'}</span>
                      {currentStep < totalSteps && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />}
                    </>
                  )}
                </button>
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
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f23b36]"></div>
      </div>
    }>
      <CreatePage />
    </Suspense>
  );
}

export default CreatePageWithSuspense;