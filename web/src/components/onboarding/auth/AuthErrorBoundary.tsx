// components/AuthErrorBoundary.tsx
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  onReset: () => void;
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
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
