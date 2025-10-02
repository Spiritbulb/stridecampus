// components/SignUpSteps.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FormInput } from './FormInput';

interface SignUpStepsProps {
  step: number;
  formData: { username: string; email: string; password: string; full_name: string };
  validation: {
    username?: { valid: boolean; message: string };
    email?: { valid: boolean; message: string };
  };
  focusedField: string | null;
  onFieldFocus: (field: string) => void;
  onFieldBlur: () => void;
  onFieldChange: (field: string, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  loading: boolean;
}

export const SignUpSteps: React.FC<SignUpStepsProps> = ({
  step,
  formData,
  validation,
  focusedField,
  onFieldFocus,
  onFieldBlur,
  onFieldChange,
  onNext,
  onPrev,
  onSubmit,
  loading
}) => {
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <FormInput
              type="text"
              label="Pick a username"
              placeholder="lanadelrey"
              value={formData.username}
              onChange={(value) => onFieldChange('username', value)}
              onFocus={() => onFieldFocus('username')}
              onBlur={onFieldBlur}
              focused={focusedField === 'username'}
              validation={validation.username}
              required
            />

            <FormInput
              type="text"
              label="Enter your full name"
              placeholder="Lana Del Rey"
              value={formData.full_name}
              onChange={(value) => onFieldChange('full_name', value)}
              onFocus={() => onFieldFocus('full_name')}
              onBlur={onFieldBlur}
              focused={focusedField === 'full_name'}
              required
            />
            
            <button
              type="button"
              onClick={onNext}
              disabled={!formData.username.trim() || (validation.username && !validation.username.valid) || !formData.full_name.trim()}
              className="w-full py-4 px-6 rounded-2xl font-semibold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 transform hover:scale-105 hover:shadow-lg group"
              style={{ backgroundColor: '#f23b36' }}
            >
              <span>Continue</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <FormInput
              type="email"
              label="Email address"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(value) => onFieldChange('email', value)}
              onFocus={() => onFieldFocus('email')}
              onBlur={onFieldBlur}
              focused={focusedField === 'email'}
              validation={validation.email}
              required
            />
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onPrev}
                className="px-8 py-4 text-gray-600 rounded-2xl font-semibold hover:text-gray-900 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={onNext}
                disabled={!formData.email.trim() || (validation.email && !validation.email.valid)}
                className="flex-1 py-4 px-6 rounded-2xl font-semibold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 transform hover:scale-105 hover:shadow-lg group"
                style={{ backgroundColor: '#f23b36' }}
              >
                <span>Continue</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <FormInput
              type="password"
              label="Create a secure password"
              placeholder="Choose a strong password"
              value={formData.password}
              onChange={(value) => onFieldChange('password', value)}
              onFocus={() => onFieldFocus('password')}
              onBlur={onFieldBlur}
              focused={focusedField === 'password'}
              required
              showValidation={false}
            />
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onPrev}
                className="px-8 py-4 text-gray-600 rounded-2xl font-semibold hover:text-gray-900 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={onSubmit}
                disabled={!formData.password.trim() || loading}
                className="flex-1 py-4 px-6 rounded-2xl font-semibold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 transform hover:scale-105 hover:shadow-lg group"
                style={{ backgroundColor: '#f23b36' }}
              >
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderStep();
};