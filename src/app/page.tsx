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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Dashboard for logged-in users
  if (user) {
    return (
      <div ref={containerRef} className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Header */}
          <header className="mb-16 text-center">
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
              Welcome back,{' '}
              <span className="font-medium">{user.username || user.email}</span>
            </h1>
            
            {/* Credits */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <Coins className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{user.credits || 50} Credits</span>
            </div>
          </header>

          {/* Main Action */}
          <div className="text-center mb-16">
            <a 
              href="/arena" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200"
            >
              Continue to Arena
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Feed Component - Normal layout, not modal */}
          {showFeed && (
            <div 
              ref={feedRef}
              className="transition-all duration-500 ease-in-out pt-16 border-t border-border"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-medium text-foreground mb-2">
                  Your Campus Feed
                </h2>
                <p className="text-muted-foreground">
                  Stay updated with your community discussions
                </p>
              </div>
              
              <div className="bg-card">
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center">
          <h1 className="text-5xl md:text-6xl font-light text-foreground mb-6 leading-tight">
            Student collaboration,
            <br />
            <span className="font-medium">simplified</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Join your verified campus community. Earn credits through participation. 
            Amplify your voice in student discussions.
          </p>
          
          <div className="space-y-4">
            <a 
              href="/auth" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </a>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Free for students • School email required</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}