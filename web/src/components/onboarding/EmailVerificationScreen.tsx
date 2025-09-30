// components/onboarding/EmailVerificationScreen.tsx
import React from 'react';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';

interface EmailVerificationScreenProps {
  email: string;
  onResendVerification: () => void;
  onBack: () => void;
  onCheckVerification: () => void;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  email,
  onResendVerification,
  onBack,
  onCheckVerification
}) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button 
          onClick={onBack}
          className="mb-6 text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110 rounded-full hover:bg-gray-50 flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600">
            We've sent a verification link to
          </p>
          <p className="text-gray-900 font-medium mb-4">{email}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">What to do next:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Check your inbox for an email from us</li>
            <li>Click the verification link in the email</li>
            <li>Return here to continue</li>
          </ol>
        </div>

        <div className="space-y-4">
          <button
            onClick={onCheckVerification}
            className="w-full py-3 px-6 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-300"
          >
            I've verified my email
          </button>

          <button
            onClick={onResendVerification}
            className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Resend verification email
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Didn't receive the email? Check your spam folder or try again.
        </p>
      </div>
    </div>
  );
};