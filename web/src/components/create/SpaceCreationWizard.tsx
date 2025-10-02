'use client';
import React, { useState, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Space } from '@/utils/supabaseClient';
import { Camera, Lock, Globe, ArrowLeft, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

interface SpaceCreationWizardProps {
  onSuccess: (space: Space) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  displayName: string;
  description: string;
  isPublic: boolean;
  logo: File | null;
}

type Step = 'basic' | 'details' | 'privacy';

export default function SpaceCreationWizard({ onSuccess, onCancel }: SpaceCreationWizardProps) {
  const { user } = useApp();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    displayName: '',
    description: '',
    isPublic: true,
    logo: null
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const uploadLogoToR2 = async (file: File, spaceId: string): Promise<string> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const consistentFilename = `space_logo_${spaceId}.${fileExtension}`;
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('filename', consistentFilename);
    formDataUpload.append('metadata', JSON.stringify({
      userId: user?.id || 'unknown',
      subject: 'space-logo',
      description: `Logo for space: ${formData.displayName || formData.name}`,
      tags: `space,logo,${spaceId}`,
      spaceId: spaceId,
      spaceName: formData.displayName || formData.name
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
    
    // API returns: { success: true, data: { filename, ... } }
    //@ts-ignore
    if (result.success && result.data?.filename) {
      //@ts-ignore
      return `https://media.stridecampus.com/${result.data.filename}`;
    }
    
    //@ts-ignore
    throw new Error(result.error || 'Upload failed');
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

    setFormData({ ...formData, logo: file });
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setFormData({ ...formData, logo: null });
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 'basic') {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        newErrors.name = 'Space name is required';
      } else if (trimmedName.length < 3 || trimmedName.length > 21) {
        newErrors.name = 'Name must be between 3 and 21 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
        newErrors.name = 'Name can only contain letters, numbers, and underscores';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 'basic') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      setCurrentStep('privacy');
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('basic');
    } else if (currentStep === 'privacy') {
      setCurrentStep('details');
    } else {
      onCancel();
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a space',
        variant: 'destructive'
      });
      return;
    }

    if (!validateStep('basic')) {
      setCurrentStep('basic');
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedName = formData.name.trim().toLowerCase();

      // Check if space name already exists
      const { data: existingSpace, error: checkError } = await supabase
        .from('spaces')
        .select('id')
        .eq('name', trimmedName)
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existingSpace) {
        setErrors({ name: 'A space with this name already exists' });
        setCurrentStep('basic');
        setIsSubmitting(false);
        return;
      }

      // Create the space
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert({
          name: trimmedName,
          display_name: formData.displayName.trim() || formData.name.trim(),
          description: formData.description.trim() || null,
          is_public: formData.isPublic,
          creator_id: user.id
        })
        .select()
        .single();

      if (spaceError) throw spaceError;

      // Upload logo if provided
      if (formData.logo) {
        try {
          const logoUrl = await uploadLogoToR2(formData.logo, space.id);
          
          const { error: updateError } = await supabase
            .from('spaces')
            .update({ logo_url: logoUrl })
            .eq('id', space.id);

          if (updateError) throw updateError;
          space.logo_url = logoUrl;
        } catch (uploadError) {
          console.error('Logo upload error:', uploadError);
          toast({
            title: 'Partial success',
            description: 'Space created but logo upload failed',
            variant: 'destructive'
          });
        }
      }

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
        title: 'Space created',
        description: `${space.display_name} has been created successfully`
      });

      onSuccess(space);
    } catch (error: any) {
      console.error('Error creating space:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create space',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 'basic') {
      const trimmedName = formData.name.trim();
      return trimmedName.length >= 3 && 
             trimmedName.length <= 21 && 
             /^[a-zA-Z0-9_]+$/.test(trimmedName) &&
             !errors.name;
    }
    return true;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#f23b36] rounded-full mx-auto flex items-center justify-center">
                <Check className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Choose a name</h3>
                <p className="text-gray-600 mt-2 text-sm">
                  This will be your space's unique identifier
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Space name <span className="text-[#f23b36]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s+/g, '_').toLowerCase();
                    setFormData({ ...formData, name: value });
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="my_awesome_space"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-[#f23b36] focus:border-transparent'
                  }`}
                  maxLength={21}
                  autoFocus
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Letters, numbers, and underscores only • {formData.name.length}/21
                </p>
              </div>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#f23b36] rounded-full mx-auto flex items-center justify-center">
                <Camera className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Add details</h3>
                <p className="text-gray-600 mt-2 text-sm">
                  Help people understand what your space is about
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Display name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="My Awesome Space"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f23b36] focus:border-transparent focus:outline-none transition-all text-sm"
                  maxLength={100}
                />
                <p className="mt-2 text-xs text-gray-500">
                  This is how your space will appear to members
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell people what makes your space special..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f23b36] focus:border-transparent focus:outline-none transition-all resize-none text-sm"
                  maxLength={500}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Help people discover and understand your space
                  </p>
                  <span className={`text-xs ${formData.description.length > 450 ? 'text-[#f23b36]' : 'text-gray-400'}`}>
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Space logo <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <div 
                      className="w-full h-full border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="text-gray-400" size={24} />
                      )}
                    </div>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLogo();
                        }}
                        className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#f23b36] hover:text-[#d93531] font-semibold transition-colors text-sm"
                    >
                      {logoPreview ? 'Change logo' : 'Upload logo'}
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      Square image, at least 200x200px, max 5MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#f23b36] rounded-full mx-auto flex items-center justify-center">
                <Lock className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Privacy settings</h3>
                <p className="text-gray-600 mt-2 text-sm">
                  Choose who can see and participate in your space
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label 
                className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.isPublic 
                    ? 'border-[#f23b36] bg-[#f23b36]/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="privacy"
                  checked={formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: true })}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    formData.isPublic ? 'bg-[#f23b36]' : 'bg-gray-100'
                  }`}>
                    <Globe className={formData.isPublic ? 'text-white' : 'text-gray-400'} size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Public Space</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Anyone can discover, view, and participate in your space
                    </p>
                  </div>
                </div>
              </label>

              <label 
                className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  !formData.isPublic 
                    ? 'border-[#f23b36] bg-[#f23b36]/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="privacy"
                  checked={!formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: false })}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !formData.isPublic ? 'bg-[#f23b36]' : 'bg-gray-100'
                  }`}>
                    <Lock className={!formData.isPublic ? 'text-white' : 'text-gray-400'} size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Private Space</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Only approved members can see and participate
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

  const steps: Step[] = ['basic', 'details', 'privacy'];
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Create Space</h2>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <React.Fragment key={step}>
                  <div 
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStepIndex ? 'bg-[#f23b36]' : 'bg-gray-300'
                    }`}
                  />
                  {index < steps.length - 1 && (
                    <div 
                      className={`w-8 h-0.5 transition-colors ${
                        index < currentStepIndex ? 'bg-[#f23b36]' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="min-h-[400px]">
            {renderStep()}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-3">
              {currentStep !== 'privacy' ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="px-6 py-2 bg-[#f23b36] text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d93531] transition-colors text-sm"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#f23b36] text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d93531] transition-colors text-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Create Space'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}