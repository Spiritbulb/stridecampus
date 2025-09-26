// SpaceCreationWizard.tsx
'use client';
import React, { useState, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Space } from '@/utils/supabaseClient';
import { Camera, Lock, Globe, ArrowLeft, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    displayName: '',
    description: '',
    isPublic: true,
    logo: null
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateStep = (step: Step): boolean => {
    const newErrors: Partial<FormData> = {};

    if (step === 'basic') {
      if (!formData.name.trim()) {
        newErrors.name = 'Community name is required';
      } else if (formData.name.length < 3 || formData.name.length > 21) {
        newErrors.name = 'Name must be between 3 and 21 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.name)) {
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
        description: 'Please sign in to create a community',
        variant: 'destructive'
      });
      return;
    }

    if (!validateStep('basic')) return;

    setIsSubmitting(true);

    try {
      // Check if space name already exists
      const { data: existingSpace, error: checkError } = await supabase
        .from('spaces')
        .select('id')
        .eq('name', formData.name.toLowerCase())
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existingSpace) {
        setErrors({ name: 'A community with this name already exists' });
        setCurrentStep('basic');
        setIsSubmitting(false);
        return;
      }

      // Create the space
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert({
          name: formData.name.toLowerCase(),
          display_name: formData.displayName.trim() || formData.name,
          description: formData.description.trim() || null,
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

      onSuccess(space);
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

  const canProceed = () => {
    if (currentStep === 'basic') {
      return formData.name.length >= 3 && 
             formData.name.length <= 21 && 
             /^[a-zA-Z0-9_]+$/.test(formData.name) &&
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
                <p className="text-gray-600 mt-2">
                  This will be your community's unique identifier
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Community name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s+/g, '_').toLowerCase();
                    setFormData({ ...formData, name: value });
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="my_awesome_community"
                  className={`w-full p-3 border rounded-lg focus:outline-none transition-colors ${
                    errors.name 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:border-[#f23b36]'
                  }`}
                  maxLength={21}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
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
                <p className="text-gray-600 mt-2">
                  Help people understand what your community is about
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="My Awesome Community"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#f23b36] focus:outline-none transition-colors"
                  maxLength={100}
                />
                <p className="mt-1 text-sm text-gray-500">
                  This is how your community will appear to members
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell people what makes your community special..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#f23b36] focus:outline-none transition-colors resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-sm text-gray-500">
                    Help people discover and understand your community
                  </p>
                  <span className={`text-sm ${formData.description.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Community logo <span className="text-gray-400">(optional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.logo ? (
                      <img 
                        src={URL.createObjectURL(formData.logo)} 
                        alt="Logo preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Camera className="text-gray-400" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#f23b36] hover:text-[#e12e29] font-medium transition-colors"
                    >
                      {formData.logo ? 'Change logo' : 'Upload logo'}
                    </button>
                    <p className="text-sm text-gray-500 mt-1">
                      Recommended: Square image, at least 200x200px
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFormData({ ...formData, logo: file });
                    }}
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
                <p className="text-gray-600 mt-2">
                  Choose who can see and participate in your community
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label 
                className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    formData.isPublic ? 'bg-[#f23b36]' : 'bg-gray-100'
                  }`}>
                    <Globe className={formData.isPublic ? 'text-white' : 'text-gray-400'} size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Public Community</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Anyone can discover, view, and participate in your community
                    </p>
                  </div>
                </div>
              </label>

              <label 
                className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    !formData.isPublic ? 'bg-[#f23b36]' : 'bg-gray-100'
                  }`}>
                    <Lock className={!formData.isPublic ? 'text-white' : 'text-gray-400'} size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Private Community</h4>
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
    <div className="p-6 space-y-8">
      {/* Progress indicator */}
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

      {/* Step content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-3">
          {currentStep !== 'privacy' ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2 bg-[#f23b36] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e12e29] transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#f23b36] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e12e29] transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Community'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}