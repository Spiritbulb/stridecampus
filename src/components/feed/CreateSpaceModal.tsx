'use client';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabaseClient';
import { X, Lock, Globe, ArrowLeft, ArrowRight, Upload, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CreateSpaceModalProps {
  onClose: () => void;
  onSpaceCreated: () => void;
}

export default function CreateSpaceModal({ onClose, onSpaceCreated }: CreateSpaceModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    isPublic: true,
    logo: null as File | null
  });

  const totalSteps = 4;

  const handleSubmit = async () => {
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

      onSpaceCreated();
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
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
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
              onClick={onClose}
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
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="min-h-[60vh] flex items-center justify-center">
          {renderStepContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {currentStep === totalSteps ? 'Ready to create your community?' : 'Fill out the information above to continue'}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
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
  );
}