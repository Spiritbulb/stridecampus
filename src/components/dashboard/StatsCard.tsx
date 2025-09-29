import React, { useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';


interface StatsCardProps {
  title: string;
  value: string;
  icon: any;
  color: 'text-accent' | 'text-warning' | 'text-destructive' | 'text-primary';
  onClick?: () => void;
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// Enhanced color mappings for the new gradient design
const GRADIENT_BG_MAP = {
  'text-accent': 'from-red-50 via-white to-pink-50',
  'text-warning': 'from-amber-50 via-white to-orange-50',
  'text-destructive': 'from-rose-50 via-white to-red-50',
  'text-primary': 'from-blue-50 via-white to-indigo-50'
} as const;

const ACCENT_COLOR_MAP = {
  'text-accent': 'from-[#f23b36] to-pink-500',
  'text-warning': 'from-amber-500 to-orange-500',
  'text-destructive': 'from-red-500 to-rose-500',
  'text-primary': 'from-blue-500 to-indigo-500'
} as const;

const ICON_GRADIENT_MAP = {
  'text-accent': 'from-[#f23b36] to-[#e12a24]',
  'text-warning': 'from-amber-600 to-orange-600',
  'text-destructive': 'from-red-600 to-rose-600',
  'text-primary': 'from-blue-600 to-indigo-600'
} as const;

const DECORATION_COLOR_MAP = {
  'text-accent': 'from-red-100 to-pink-100',
  'text-warning': 'from-amber-100 to-orange-100',
  'text-destructive': 'from-rose-100 to-red-100',
  'text-primary': 'from-blue-100 to-indigo-100'
} as const;

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  onClick,
  loading = false,
  trend 
}) => {
  // Memoize the trend indicator with enhanced styling
  const trendIndicator = useMemo(() => {
    if (!trend) return null;
    
    const trendText = trend.isPositive ? '+' : '';
    const trendColor = trend.isPositive ? 'text-green-600' : 'text-red-600';
    const trendBg = trend.isPositive ? 'bg-green-100' : 'bg-red-100';
    const trendIcon = trend.isPositive ? '↗' : '↘';
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendColor} ${trendBg} mt-2`}>
        <span>{trendIcon}</span>
        <span>{trendText}{trend.value}%</span>
      </div>
    );
  }, [trend]);

  // Handle click with proper keyboard accessibility
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div 
      className={`
        relative overflow-hidden bg-gradient-to-br ${GRADIENT_BG_MAP[color]} rounded-3xl p-6 
        shadow-sm border border-gray-100 transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300' : 'hover:shadow-md'}
        ${loading ? 'opacity-70' : ''}
      `}
      onClick={onClick}
      onKeyPress={onClick ? handleKeyPress : undefined}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? 'button' : 'figure'}
      aria-label={onClick ? `${title}: ${value}` : undefined}
    >
      {/* Background decorations */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${DECORATION_COLOR_MAP[color]} rounded-full opacity-30 transform translate-x-16 -translate-y-16`}></div>
      <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${DECORATION_COLOR_MAP[color]} rounded-full opacity-20 transform -translate-x-12 translate-y-12`}></div>
      
      <div className="relative flex items-center gap-6">
        {/* Enhanced Icon Section */}
        <div className="flex justify-center items-center">
          <div className="relative group">
            <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>
            <div className={`
              w-16 h-16 bg-gradient-to-br ${ICON_GRADIENT_MAP[color]} rounded-2xl 
              flex items-center justify-center transform group-hover:scale-105 
              transition-transform duration-500 relative z-10 shadow-lg
            `}>
              {loading ? (
                <div className="w-8 h-8 bg-white/30 rounded-md animate-pulse"></div>
              ) : (
                <HugeiconsIcon icon={Icon} className="w-8 h-8 text-white" />  
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="text-left flex-1 min-w-0">
          <div className="space-y-1">
            {loading ? (
              <>
                <div className="h-8 bg-gray-200 rounded-lg animate-pulse mb-3 w-20"></div>
                <div className="h-5 bg-gray-200 rounded-lg animate-pulse w-32"></div>
              </>
            ) : (
              <>
                <div className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-gray-800 via-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                  {value}
                </div>
                <div className="text-gray-600 text-lg font-medium leading-relaxed">
                  {title}
                </div>
                <div className="w-12 h-0.5 bg-gradient-to-r ${ACCENT_COLOR_MAP[color]} rounded-full mt-2"></div>
                {trendIndicator}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hover shine effect */}
      {onClick && (
        <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 pointer-events-none"></div>
      )}
    </div>
  );
};