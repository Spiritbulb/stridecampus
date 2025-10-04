import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';

interface AuthScreenProps {
  onBack: () => void;
  user: any;
  referralCode?: string;
  isLoading: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onBack,
  user,
  referralCode,
  isLoading
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { loginWithRedirect } = useAuth0();

  const handleAuth0SignIn = async () => {
    setLoading(true);
    setError('');
    await loginWithRedirect();
    setTimeout(() => {
      setLoading(false);
      setError('');
    }, 2000);
  };

  const switchAuthMode = () => {
    setError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer {
          background: linear-gradient(to right, #ef4444 0%, #dc2626 50%, #ef4444 100%);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite linear;
        }
      `}</style>

      <button 
        onClick={onBack}
        className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110 p-2 z-20"
      >
        <ArrowLeft size={24} />
      </button>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header with enhanced styling */}
        <div className="text-center mb-12 relative">
          <div className="space-y-4">
            <div className="inline-block mb-4">
                <img src="/logo.png" alt="Stride Campus" className="w-16 h-16" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-red-900 to-gray-900 bg-clip-text text-transparent transform transition-all duration-500">
              It's official!
            </h2>
            <p className="text-gray-600 text-lg font-medium">
             You're about to join the Stride Campus community
            </p>
          </div>
        </div>

        {/* Glass morphism card */}
        <div className="backdrop-blur-xl bg-white/70 p-8 rounded-3xl shadow-2xl border border-white/20 transform transition-all duration-500 hover:shadow-red-200/50">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200 animate-pulse">
              <p className="text-red-600 text-sm font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Main Auth0 Button */}
          <div className="space-y-6">
            <button
              onClick={handleAuth0SignIn}
              disabled={loading}
              className="group relative w-full overflow-hidden bg-gradient-to-r from-red-600 to-red-700 text-white py-5 px-6 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Redirecting...
                  </>
                ) : (
                  <>
                    Continue
                    <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </>
                )}
              </span>
            </button>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="text-center p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-xs font-semibold text-gray-700">Instant</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="text-2xl mb-1">🔒</div>
                <div className="text-xs font-semibold text-gray-700">Secure</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="text-2xl mb-1">✨</div>
                <div className="text-xs font-semibold text-gray-700">Simple</div>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};