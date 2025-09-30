import React from 'react';
import { TrendingUp, Trophy, Star, Zap } from 'lucide-react';
import { useLevelProgression, useCreditEconomy } from '@/hooks/useCreditEconomy';

interface LevelDisplayProps {
  userId: string;
  showProgress?: boolean;
  compact?: boolean;
}

export const LevelDisplay: React.FC<LevelDisplayProps> = ({ 
  userId, 
  showProgress = true, 
  compact = false 
}) => {
  const { levelProgress, loading } = useLevelProgression(userId);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        {showProgress && <div className="h-2 bg-gray-200 rounded w-full"></div>}
      </div>
    );
  }

  if (!levelProgress) {
    return null;
  }

  const { currentLevel, levelName, creditsToNext, progressPercentage, totalEarned, isMaxLevel } = levelProgress;

  const getLevelIcon = (level: number) => {
    if (level >= 8) return <Star className="w-4 h-4 text-yellow-500" />;
    if (level >= 5) return <Trophy className="w-4 h-4 text-yellow-600" />;
    if (level >= 3) return <TrendingUp className="w-4 h-4 text-blue-500" />;
    return <Zap className="w-4 h-4 text-green-500" />;
  };

  const getLevelColor = (level: number) => {
    if (level >= 8) return 'text-yellow-500';
    if (level >= 5) return 'text-yellow-600';
    if (level >= 3) return 'text-blue-500';
    return 'text-green-500';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getLevelIcon(currentLevel)}
        <span className={`text-sm font-semibold ${getLevelColor(currentLevel)}`}>
          Level {currentLevel} {levelName}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Level Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getLevelIcon(currentLevel)}
          <div>
            <h3 className={`font-bold text-lg ${getLevelColor(currentLevel)}`}>
              Level {currentLevel} {levelName}
            </h3>
            <p className="text-sm text-gray-600">
              {totalEarned.toLocaleString()} total credits earned
            </p>
          </div>
        </div>
        {!isMaxLevel && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Next Level</p>
            <p className="font-semibold text-gray-800">{creditsToNext} credits</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && !isMaxLevel && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress to Level {currentLevel + 1}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out ${
                currentLevel >= 8 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                currentLevel >= 5 ? 'bg-gradient-to-r from-yellow-500 to-yellow-700' :
                currentLevel >= 3 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                'bg-gradient-to-r from-green-400 to-green-600'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Max Level Message */}
      {isMaxLevel && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full">
            <Star className="w-5 h-5" />
            <span className="font-semibold">Max Level Achieved!</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            You've reached the highest level in StrideCampus
          </p>
        </div>
      )}
    </div>
  );
};

// Compact level badge for use in headers, cards, etc.
export const LevelBadge: React.FC<{ userId: string }> = ({ userId }) => {
  const { levelProgress, loading } = useLevelProgression(userId);

  if (loading) {
    return <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>;
  }

  if (!levelProgress) return null;

  const { currentLevel, levelName } = levelProgress;

  const getBadgeColor = (level: number) => {
    if (level >= 8) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (level >= 5) return 'bg-gradient-to-r from-yellow-500 to-yellow-700 text-white';
    if (level >= 3) return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
    return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getBadgeColor(currentLevel)}`}>
      <span>L{currentLevel}</span>
      <span className="hidden sm:inline">{levelName}</span>
    </div>
  );
};

// Credit balance display
export const CreditBalance: React.FC<{ 
  userId: string; 
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ userId, showIcon = true, size = 'md' }) => {
  const { creditSummary, loading } = useCreditEconomy(userId);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className={`bg-gray-200 rounded ${size === 'sm' ? 'h-4 w-16' : size === 'lg' ? 'h-6 w-24' : 'h-5 w-20'}`}></div>
      </div>
    );
  }

  if (!creditSummary) return null;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex items-center gap-1 ${sizeClasses[size]}`}>
      {showIcon && <TrendingUp className="w-4 h-4 text-[#f23b36]" />}
      <span className="font-semibold text-gray-800">
        {creditSummary.currentCredits.toLocaleString()}
      </span>
      <span className="text-gray-500">credits</span>
    </div>
  );
};
