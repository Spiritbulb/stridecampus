import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, Trophy, Gift, Activity, MessageSquare, Settings } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { ActivityFeed } from './ActivityFeed';
import { Leaderboard } from './Leaderboard';
import { QuickActions } from './QuickActions';
import { QUICK_ACTIONS } from './deps/actions';
import { User } from '@/utils/supabaseClient';
import {MyLibrary} from '../library/MyLibrary';
import { ArrowTurnUpFreeIcons, Coins01FreeIcons, Calendar01FreeIcons, ArrowUp01FreeIcons, RankingIcon } from '@hugeicons/core-free-icons';

interface DashboardProps {
  user: User;
  transactions: any[];
  leaderboard: any[];
  onCreateTransaction: any,
  onRefetchTransactions: any,
  isLoading: {
    transactions: boolean;
    leaderboard: boolean;
    auth: boolean;
  };
}

// Predefined welcome messages to avoid recreation
const WELCOME_MESSAGES = [
  'Welcome back',
  'Hello',
  'What\'s up',
  'Rise and shine',
  'Good Morning',
  'Good Evening',
  'Howdy',
] as const;

export const Dashboard: React.FC<DashboardProps> = ({ user, transactions, leaderboard, isLoading }) => {
  // State for greeting animation
  const [greetingAnimation, setGreetingAnimation] = useState(false);
  
  // Determine user's position in the leaderboard
  const leaderboardPosition = useMemo(() => {
    return leaderboard.find(entry => entry.id === user.id)?.position;
  }, [leaderboard, user.id]);

  // Memoize stats to prevent unnecessary recalculations
  const stats = useMemo(() => [
    {
      title: 'Credits Rank',
      value: leaderboardPosition ? `# ${leaderboardPosition}` : 'Unranked',
      icon: RankingIcon,
      color: 'text-warning' as const
    },
    {
      title: 'Total Credits',
      value: user.credits.toString(),
      icon: Coins01FreeIcons,
      color: 'text-accent' as const
    },
    {
      title: 'Login Streak',
      value: `${user.login_streak} days`,
      icon: Calendar01FreeIcons,
      color: 'text-destructive' as const
    }
  ], [user.credits, user.login_streak, leaderboardPosition]);

  // Get timed greeting message
  const timedMessage = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return WELCOME_MESSAGES[4]; // Good Morning
    if (hour < 18) return WELCOME_MESSAGES[0]; // Welcome back
    if (hour < 22) return WELCOME_MESSAGES[5]; // Good Evening
    return WELCOME_MESSAGES[2]; // What's up
  }, []);

  // Get username safely
  const userName = useMemo(() => {
    return user.username;
  }, [user.username]);

  // Trigger greeting animation on component mount
  useEffect(() => {
    setGreetingAnimation(true);
    const timer = setTimeout(() => setGreetingAnimation(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Format user info line
  const userInfoLine = useMemo(() => {
    const parts = [];
    if (user.year_of_study) parts.push(user.year_of_study);
    if (user.major) parts.push(user.major);
    if (user.school_name) parts.push(user.school_name);
    return parts.join(' • ');
  }, [user.year_of_study, user.major, user.school_name]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <h1 className={`text-4xl font-bold text-gray-900 transition-all duration-500 ${
            greetingAnimation ? 'scale-105' : 'scale-100'
          }`}>
            {timedMessage}, {userName}!
          </h1>
          {userInfoLine && (
            <p className="text-gray-600 text-lg">
              {userInfoLine}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={`${stat.title}-${index}`} 
              className="animate-in slide-in-from-right-4 duration-500" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <StatsCard 
                {...stat} 
                loading={isLoading.leaderboard && stat.title === 'Credits Rank'}
              />
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: '500ms' }}>
            <Leaderboard 
              leaderboard={leaderboard} 
              currentUserId={user?.id} 
              loading={isLoading.leaderboard}
              user={user}
            />
          </div>

        {/* Quick Actions */}
        <div className="animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: '300ms' }}>
          <QuickActions actions={QUICK_ACTIONS} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
         
          
          {/* Library */}
          <div className="animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: '500ms' }}>
          <MyLibrary user={user}/>
          </div>

        </div>
        
      </div>
    </div>
  );
};