// hooks/useAuthForm.ts
import { useState, useEffect } from 'react';
import { isValidSchoolEmail, isUsernameAvailable } from '@/utils/auth';

interface FormData {
  email: string;
  password: string;
  username: string;
  full_name: string;
}

interface ValidationState {
  username?: { valid: boolean; message: string };
  email?: { valid: boolean; message: string };
}

export const useAuthForm = (isSignUp: boolean, step: number) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    username: '',
    full_name: '',
  });
  
  const [validation, setValidation] = useState<ValidationState>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Real-time username validation
  useEffect(() => {
    if (isSignUp && step === 1 && formData.username && formData.full_name) {
      const validateUsername = async () => {
        const result = await isUsernameAvailable(formData.username);
        setValidation(prev => ({
          ...prev,
          username: {
            valid: result.available,
            message: result.message || ''
          }
        }));
      };

      const timeoutId = setTimeout(validateUsername, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.username, isSignUp, step, formData.full_name]);

  // Real-time email validation
  useEffect(() => {
    if ((isSignUp && step === 2) || !isSignUp) {
      if (formData.email) {
        const result = isValidSchoolEmail(formData.email);
        setValidation(prev => ({
          ...prev,
          email: {
            valid: result.isValid,
            message: result.message || ''
          }
        }));
      } else {
        setValidation(prev => ({ ...prev, email: undefined }));
      }
    }
  }, [formData.email, isSignUp, step]);

  const resetForm = () => {
    setFormData({ email: '', password: '', username: '', full_name: '' });
    setValidation({});
    setFocusedField(null);
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    validation,
    focusedField,
    setFocusedField,
    updateField,
    resetForm
  };
};
