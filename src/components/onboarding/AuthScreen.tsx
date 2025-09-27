// Main AuthScreen component
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { isValidSchoolEmail, isUsernameAvailable } from '@/utils/auth';
import { supabase } from '@/utils/supabaseClient';

// Import all the modular components
import { useAuthForm } from '@/hooks/useAuthForm';
import { ProgressIndicator } from './auth/ProgressIndicator';
import { EmailVerification } from './auth/EmailVerification';
import { SignUpSteps } from './auth/SignUpSteps';
import { SignInForm } from './auth/SignInForm';
import { AuthErrorBoundary } from './auth/AuthErrorBoundary';

interface AuthScreenProps {
  onSignUp: (email: string, password: string, username: string, referralCode?: string) => Promise<void>;
  onSignIn: (email: string, password: string) => Promise<void>;
  onBack: () => void;
  user: any;
  referralCode?: string;
  isLoading: boolean;
  needsVerification?: boolean;
  verificationEmail?: string;
  onVerificationComplete?: () => void;
}

// Auth state management
enum AuthState {
  SIGN_IN = 'SIGN_IN',
  SIGN_UP = 'SIGN_UP',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION'
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onSignUp, 
  onSignIn, 
  onBack,
  user,
  referralCode,
  isLoading,
  needsVerification = false,
  verificationEmail = '',
  onVerificationComplete
}) => {
  const [authState, setAuthState] = useState<AuthState>(AuthState.SIGN_UP);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>('');

  const isSignUp = authState === AuthState.SIGN_UP;
  
  // Use the custom hook for form management
  const {
    formData,
    validation,
    focusedField,
    setFocusedField,
    updateField,
    resetForm
  } = useAuthForm(isSignUp, step);

  // Check if user needs email verification on mount or when props change
  useEffect(() => {
    if (needsVerification && verificationEmail) {
      setPendingVerificationEmail(verificationEmail);
      setAuthState(AuthState.EMAIL_VERIFICATION);
    } else {
      // Check current user status
      const checkUserVerificationStatus = async () => {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (currentUser && !currentUser.email_confirmed_at && currentUser.email) {
            // User exists but email is not verified
            setPendingVerificationEmail(currentUser.email);
            setAuthState(AuthState.EMAIL_VERIFICATION);
          }
        } catch (error) {
          console.error('Error checking user verification status:', error);
        }
      };

      if (!needsVerification) {
        checkUserVerificationStatus();
      }
    }
  }, [needsVerification, verificationEmail]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event, session?.user?.email_confirmed_at);
        //@ts-ignore
        if (event === 'SIGNED_UP' || (event === 'SIGNED_IN' && session?.user && !session.user.email_confirmed_at)) {
          // User just signed up or signed in but not verified, show verification screen
          const emailToVerify = session?.user?.email || formData.email;
          if (emailToVerify) {
            setPendingVerificationEmail(emailToVerify);
            setAuthState(AuthState.EMAIL_VERIFICATION);
          }
        } else if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          // User is signed in and verified, continue to app
          console.log('User verified, continuing...');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [formData.email]);

  const resetAuthState = () => {
    resetForm();
    setStep(1);
    setLoading(false);
    setError('');
    setPendingVerificationEmail('');
    setAuthState(AuthState.SIGN_UP);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        // Final validation before submission
        const emailValidation = isValidSchoolEmail(formData.email);
        if (!emailValidation.isValid) {
          throw new Error(emailValidation.message);
        }

        const usernameCheck = await isUsernameAvailable(formData.username);
        if (!usernameCheck.available) {
          throw new Error(usernameCheck.message);
        }

        // Store the email before signup in case we need it for verification
        setPendingVerificationEmail(formData.email);
        
        // Attempt sign up
        await onSignUp(formData.email, formData.password, formData.username, referralCode);
        
        // The auth state change listener will handle showing verification screen
        // But as a fallback, set it here too
        setTimeout(() => {
          //@ts-ignore
          if (authState !== AuthState.EMAIL_VERIFICATION) {
            setAuthState(AuthState.EMAIL_VERIFICATION);
          }
        }, 1000);
        
      } else {
        await onSignIn(formData.email, formData.password);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication');
      // Reset verification email on error
      if (isSignUp) {
        setPendingVerificationEmail('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    updateField(field as keyof typeof formData, value);
  };

  const handleFieldFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleFieldBlur = () => {
    setFocusedField(null);
  };

  const switchAuthMode = () => {
    const newMode = isSignUp ? AuthState.SIGN_IN : AuthState.SIGN_UP;
    setAuthState(newMode);
    setStep(1);
    resetForm();
    setError('');
  };

  const handleVerificationComplete = () => {
    // Reset local state
    setPendingVerificationEmail('');
    setAuthState(AuthState.SIGN_UP);
    
    // Call parent callback if provided
    if (onVerificationComplete) {
      onVerificationComplete();
    } else {
      // Fallback: reload the page
      window.location.reload();
    }
  };

  const handleBackFromVerification = () => {
    // Allow user to go back and try a different email
    setAuthState(AuthState.SIGN_UP);
    setStep(2); // Go back to email step
    setPendingVerificationEmail('');
  };

  // Show email verification screen
  if (authState === AuthState.EMAIL_VERIFICATION) {
    return (
      <EmailVerification
        email={pendingVerificationEmail}
        onBack={handleBackFromVerification}
        onVerificationComplete={handleVerificationComplete}
      />
    );
  }

  // Main auth form
  return (
    <AuthErrorBoundary onReset={resetAuthState}>
      <div className="min-h-screen bg-white flex items-center justify-center p-6 relative">
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110 rounded-full hover:bg-gray-50 p-2"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-gray-900 transform transition-all duration-500">
                {isSignUp ? 'You won\'t regret this!' : 'Welcome back!'}
              </h2>
              <p className="text-gray-600 text-lg">
                {isSignUp ? 'We\'ll get you started in three easy steps' : 'Get back to your discussions and projects'}
              </p>
            </div>
          </div>

          {/* Progress indicator for sign up */}
          {isSignUp && (
            <ProgressIndicator currentStep={step} totalSteps={3} />
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-8">
            <div className="space-y-8">
              {isSignUp ? (
                <SignUpSteps
                  step={step}
                  formData={formData}
                  validation={validation}
                  focusedField={focusedField}
                  onFieldFocus={handleFieldFocus}
                  onFieldBlur={handleFieldBlur}
                  onFieldChange={handleFieldChange}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onSubmit={handleSubmit}
                  loading={loading}
                />
              ) : (
                <SignInForm
                  formData={formData}
                  focusedField={focusedField}
                  onFieldFocus={handleFieldFocus}
                  onFieldBlur={handleFieldBlur}
                  onFieldChange={handleFieldChange}
                  onSubmit={handleSubmit}
                  loading={loading}
                />
              )}
            </div>

            {/* Switch between sign in/up */}
            <div className="text-center pt-6">
              <button
                onClick={switchAuthMode}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-300 text-base font-medium relative group"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                <span 
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                  style={{ backgroundColor: '#f23b36' }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  );
};