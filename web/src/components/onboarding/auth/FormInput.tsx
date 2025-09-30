// components/FormInput.tsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps {
  type: 'text' | 'email' | 'password';
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  focused: boolean;
  validation?: { valid: boolean; message: string };
  required?: boolean;
  showValidation?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  type,
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  focused,
  validation,
  required = false,
  showValidation = true
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  const getBorderColor = () => {
    if (!focused) return '#e5e7eb';
    if (validation && showValidation) {
      return validation.valid ? '#10b981' : '#ef4444';
    }
    return '#f23b36';
  };

  const getUnderlineColor = () => {
    if (validation && showValidation) {
      return validation.valid ? '#10b981' : '#ef4444';
    }
    return '#f23b36';
  };

  return (
    <div className="space-y-2">
      <label className="text-gray-900 text-sm font-semibold block">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full bg-transparent px-0 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none transition-all duration-300 border-b-2 pr-12"
          style={{ borderBottomColor: getBorderColor() }}
          placeholder={placeholder}
          required={required}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        
        <div 
          className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
          style={{ 
            backgroundColor: getUnderlineColor(),
            width: focused ? '100%' : '0%'
          }}
        />
      </div>
      {validation && showValidation && (
        <p className={`text-sm ${
          validation.valid ? 'text-green-600' : 'text-red-600'
        }`}>
          {validation.message}
        </p>
      )}
    </div>
  );
};