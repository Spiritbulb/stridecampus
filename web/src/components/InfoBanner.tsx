// components/InfoBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function InfoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the banner
    const dismissed = localStorage.getItem('login-flow-banner-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('login-flow-banner-dismissed', 'true');
    }, 300); // Match animation duration
  };

  if (!isVisible) return null;

  return (
    <div
      className={`bg-blue-50 border-b border-blue-200 transition-all duration-300 ${
        isClosing ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-2 text-sm text-blue-900">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>
              <span className="font-medium">Important Update:</span> We're transitioning to a new login system. 
              You'll need to reset your password in a few days.{' '}
              <a
                href="https://www.stridecampus.com/support/auth-migration/new-login-system"
                className="underline hover:text-blue-700 font-medium"
              >
                Learn more
              </a>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-md hover:bg-blue-100 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5 text-blue-900" />
          </button>
        </div>
      </div>
    </div>
  );
}