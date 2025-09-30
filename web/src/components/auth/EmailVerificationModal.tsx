// components/auth/EmailVerificationModal.tsx
import React from 'react';
import { X } from 'lucide-react';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResend: () => void;
  isResending: boolean;
  email?: string;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  onResend,
  isResending,
  email
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground/60 hover:text-foreground"
        >
          <X size={20} />
        </button>
        
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-primary" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground">Verify Your Email</h2>
          
          <p className="text-foreground/80">
            We've sent a verification link to <span className="font-medium">{email}</span>. 
            Please check your inbox and click the link to verify your email address.
          </p>
          
          <p className="text-foreground/60 text-sm">
            Didn't receive the email? Check your spam folder or request a new verification link.
          </p>
          
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={onResend}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </button>
            
            <button
              onClick={onClose}
              className="w-full"
            >
              I'll Verify Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};