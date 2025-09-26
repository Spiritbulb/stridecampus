'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Award, 
  TrendingUp, 
  Mail, 
  Shield, 
  ChevronRight,
  Coins,
  ArrowRight
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import FeedPage from '@/components/feed/FeedPage';

export default function Home() {
  const { user, authLoading } = useApp();
  const router = useRouter();
  const feedRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showFeed, setShowFeed] = useState(false);

  // Handle feed component requesting transition
  const handleFeedTransition = () => {
    router.push('/spaces');
  };

  // Auto-show feed after delay when user is logged in
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setShowFeed(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user]);
  
  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Dashboard for logged-in users
  if (user) {
    return (
      <div ref={containerRef} className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Header */}
          <header className="mb-16 text-center">
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
              Welcome back,{' '}
              <span className="font-medium">{user.username || user.email}</span>
            </h1>
            
            {/* Credits */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
              <Coins className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">{user.credits || 50} Credits</span>
            </div>
          </header>

          {/* Main Action */}
          <div className="text-center mb-16">
            <a 
              href="/arena" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              Continue to Arena
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Feed Component - Normal layout, not modal */}
          {showFeed && (
            <div 
              ref={feedRef}
              className="transition-all duration-500 ease-in-out pt-16 border-t border-gray-100"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-medium text-gray-900 mb-2">
                  Your Campus Feed
                </h2>
                <p className="text-gray-600">
                  Stay updated with your community discussions
                </p>
              </div>
              
              <div className="bg-white">
                <FeedPage />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Landing page for non-logged-in users
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center">
          <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight">
            Student collaboration,
            <br />
            <span className="font-medium">simplified</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join your verified campus community. Earn credits through participation. 
            Amplify your voice in student discussions.
          </p>
          
          <div className="space-y-4">
            <a 
              href="/auth" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </a>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Free for students • School email required</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coins className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Earn Credits</h3>
              <p className="text-gray-600">
                Participate in campus discussions and earn credits for meaningful contributions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Build Influence</h3>
              <p className="text-gray-600">
                Spend credits to boost important messages and grow your campus presence.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Connect</h3>
              <p className="text-gray-600">
                Join verified spaces for your campus, courses, clubs, and interests.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 text-center">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">
            Ready to join your campus community?
          </h2>
          
          <a 
            href="/auth" 
            className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            Start Your Journey
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>
      </div>
    </div>
  );
}