// components/SignInForm.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FormInput } from './FormInput';

interface SignInFormProps {
  formData: { email: string; password: string };
  focusedField: string | null;
  onFieldFocus: (field: string) => void;
  onFieldBlur: () => void;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  formData,
  focusedField,
  onFieldFocus,
  onFieldBlur,
  onFieldChange,
  onSubmit,
  loading
}) => {
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
        required
        showValidation={false}
      />

      <FormInput
        type="password"
        label="Password"
        placeholder="Enter your password"
        value={formData.password}
        onChange={(value) => onFieldChange('password', value)}
        onFocus={() => onFieldFocus('password')}
        onBlur={onFieldBlur}
        focused={focusedField === 'password'}
        required
        showValidation={false}
      />
      
      <button
        type="button"
        onClick={onSubmit}
        disabled={!formData.email.trim() || !formData.password.trim() || loading}
        className="w-full py-4 px-6 rounded-2xl font-semibold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 transform hover:scale-105 hover:shadow-lg group"
        style={{ backgroundColor: '#f23b36' }}
      >
        <span>{loading ? 'Please wait...' : 'Sign In'}</span>
        {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />}
      </button>
    </div>
  );
};
