// components/EmailVerification.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../../layout/LoadingSpinner';
import { supabase } from '@/utils/supabaseClient';

interface EmailVerificationProps {
  email: string;
  onBack: () => void;
  onVerificationComplete: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onBack,
  onVerificationComplete
}) => {
  const [isResending, setIsResending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [error, setError] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);

  // Check verification status periodically
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at) {
          onVerificationComplete();
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    // Check immediately and then every 3 seconds
    checkVerificationStatus();
    const interval = setInterval(checkVerificationStatus, 3000);

    return () => clearInterval(interval);
  }, [onVerificationComplete]);

  const handleResendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      setVerificationSent(true);
      
      // Clear success message after 5 seconds
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (error: any) {
      setError(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        onVerificationComplete();
      } else {
        setError('Email not yet verified. Please check your inbox and click the verification link.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('Failed to check verification status. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110 rounded-full hover:bg-gray-50 p-2"
      >
        <ArrowLeft size={24} />
      </button>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600">
            We've sent a verification link to{' '}
            <span className="font-semibold text-gray-900">{email}</span>
          </p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-blue-600 mt-0.5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Check your inbox</h3>
              <p className="text-gray-700 text-sm">
                Click the verification link in the email we sent to complete your registration.
                The link will expire in 24 hours.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        {verificationSent && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200">
            <p className="text-green-600 text-sm font-medium">
              Verification email sent! Check your inbox.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 hover:scale-105 hover:shadow-lg"
            style={{ backgroundColor: '#f23b36' }}
          >
            {isResending ? (
              <>
                <LoadingSpinner size="small" />
                Sending...
              </>
            ) : (
              <>
                <Mail size={20} />
                Resend Verification Email
              </>
            )}
          </button>

          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 hover:scale-105"
          >
            {isChecking ? (
              <>
                <LoadingSpinner size="small" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                I've Verified My Email
              </>
            )}
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">
                <strong>Didn't receive the email?</strong> Check your spam folder or 
                ensure you entered the correct email address. You can also try resending the verification email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};