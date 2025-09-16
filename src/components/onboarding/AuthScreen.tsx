import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '../layout/LoadingSpinner';
import { isValidSchoolEmail, isUsernameAvailable } from '@/utils/auth';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Screen Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="flex justify-center">
              <div className="text-red-500 text-4xl">⚠️</div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
              <p className="text-gray-600">
                We encountered an error while loading the authentication form.
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
              className="w-full py-3 px-6 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-105"
              style={{ backgroundColor: '#f23b36' }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface AuthScreenProps {
  onSignUp: (email: string, password: string, username: string, referralCode?: string) => Promise<void>;
  onSignIn: (email: string, password: string) => Promise<void>;
  onBack: () => void;
  user: any;
  referralCode?: string;
  isLoading: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onSignUp, 
  onSignIn, 
  onBack,
  user,
  referralCode,
  isLoading
}) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [validation, setValidation] = useState<{
    username?: { valid: boolean; message: string };
    email?: { valid: boolean; message: string };
  }>({});


// Real-time username validation
  useEffect(() => {
    if (isSignUp && step === 1 && formData.username) {
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
  }, [formData.username, isSignUp, step]);

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
    setFormData({ email: '', password: '', username: '' });
    setStep(1);
    setLoading(false);
    setError('');
    setValidation({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

        await onSignUp(formData.email, formData.password, formData.username, referralCode);
      } else {
        await onSignIn(formData.email, formData.password);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  {loading && <LoadingSpinner />}
  {isLoading && <LoadingSpinner />}

  return (
    <AuthErrorBoundary onReset={resetForm}>
      <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110 rounded-full hover:bg-gray-50"
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
            <div className="flex justify-center mb-10">
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative">
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        i <= step ? 'scale-125' : 'scale-100'
                      }`}
                      style={{ 
                        backgroundColor: i <= step ? '#f23b36' : '#e5e7eb'
                      }}
                    />
                    {i <= step && (
                      <div 
                        className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-30"
                        style={{ backgroundColor: '#f23b36' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
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
              {/* Step 1: Name (Sign up only) */}
              {isSignUp && step === 1 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <label className="text-gray-900 text-sm font-semibold block">
                      Pick a username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-transparent px-0 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none transition-all duration-300 border-b-2"
                        style={{ 
                          borderBottomColor: focusedField === 'username' ? 
                            (validation.username ? (validation.username.valid ? '#10b981' : '#ef4444') : '#f23b36') : 
                            '#e5e7eb'
                        }}
                        placeholder='lanadelrey'
                        required
                      />
                      <div 
                        className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
                        style={{ 
                          backgroundColor: validation.username ? 
                            (validation.username.valid ? '#10b981' : '#ef4444') : '#f23b36',
                          width: focusedField === 'username' ? '100%' : '0%'
                        }}
                      />
                    </div>
                    {validation.username && (
                      <p className={`text-sm ${
                        validation.username.valid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {validation.username.message}
                      </p>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!formData.username.trim() || (validation.username && !validation.username.valid)}
                    className="w-full py-4 px-6 rounded-2xl font-semibold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 transform hover:scale-105 hover:shadow-lg group"
                    style={{ backgroundColor: '#f23b36' }}
                  >
                    <span>Continue</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              )}

              {/* Step 2: Email */}
              {((isSignUp && step === 2) || (!isSignUp)) && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <label className="text-gray-900 text-sm font-semibold block">
                      Email address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-transparent px-0 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none transition-all duration-300 border-b-2"
                        style={{ 
                          borderBottomColor: focusedField === 'email' ? 
                            (validation.email ? (validation.email.valid ? '#10b981' : '#ef4444') : '#f23b36') : 
                            '#e5e7eb'
                        }}
                        placeholder="your.email@university.edu"
                        required
                      />
                      <div 
                        className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
                        style={{ 
                          backgroundColor: validation.email ? 
                            (validation.email.valid ? '#10b981' : '#ef4444') : '#f23b36',
                          width: focusedField === 'email' ? '100%' : '0%'
                        }}
                      />
                    </div>
                    {validation.email && (
                      <p className={`text-sm ${
                        validation.email.valid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {validation.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password for sign in */}
                  {!isSignUp && (
                    <div className="space-y-2">
                      <label className="text-gray-900 text-sm font-semibold block">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full bg-transparent px-0 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none transition-all duration-300 border-b-2"
                          style={{ 
                            borderBottomColor: focusedField === 'password' ? '#f23b36' : '#e5e7eb'
                          }}
                          placeholder="Enter your password"
                          required
                        />
                        <div 
                          className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
                          style={{ 
                            backgroundColor: '#f23b36',
                            width: focusedField === 'password' ? '100%' : '0%'
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    {isSignUp && (
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="px-8 py-4 text-gray-600 rounded-2xl font-semibold hover:text-gray-900 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                      >
                        Back
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={isSignUp ? handleNext : () => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                      disabled={!formData.email.trim() || (!isSignUp && !formData.password.trim()) || loading}
                      className="flex-1 py-4 px-6 rounded-2xl font-semibold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 transform hover:scale-105 hover:shadow-lg group"
                      style={{ backgroundColor: '#f23b36' }}
                    >
                      <span>{loading ? 'Please wait...' : (isSignUp ? 'Continue' : 'Sign In')}</span>
                      {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Password (Sign up only) */}
              {isSignUp && step === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <label className="text-gray-900 text-sm font-semibold block">
                      Create a secure password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-transparent px-0 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none transition-all duration-300 border-b-2"
                        style={{ 
                          borderBottomColor: focusedField === 'password' ? '#f23b36' : '#e5e7eb'
                        }}
                        placeholder="Choose a strong password"
                        required
                      />
                      <div 
                        className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 transform origin-left"
                        style={{ 
                          backgroundColor: '#f23b36',
                          width: focusedField === 'password' ? '100%' : '0%'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-8 py-4 text-gray-600 rounded-2xl font-semibold hover:text-gray-900 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                    >
                      Back
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                      disabled={!formData.password.trim() || loading}
                      className="flex-1 py-4 px-6 rounded-2xl font-semibold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 transform hover:scale-105 hover:shadow-lg group"
                      style={{ backgroundColor: '#f23b36' }}
                    >
                      <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                      {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Switch between sign in/up */}
            <div className="text-center pt-6">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setStep(1);
                  setFormData({ email: '', password: '', username: '' });
                  setError('');
                }}
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