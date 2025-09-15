import React, { useMemo } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'text-accent' | 'text-warning' | 'text-destructive' | 'text-primary';
  // Optional props for better flexibility
  onClick?: () => void;
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// Predefined color mappings to avoid recreation on every render
const BG_COLOR_MAP = {
  'text-accent': 'bg-[#f23b36]/20',
  'text-warning': 'bg-amber-500/20',
  'text-destructive': 'bg-red-500/20',
  'text-primary': 'bg-blue-500/20'
} as const;

const BORDER_COLOR_MAP = {
  'text-accent': 'border-[#f23b36]/80',
  'text-warning': 'border-amber-500/80',
  'text-destructive': 'border-red-500/80',
  'text-primary': 'border-blue-500/80'
} as const;

const ICON_COLOR_MAP = {
  'text-accent': 'text-[#f23b36]',
  'text-warning': 'text-amber-600',
  'text-destructive': 'text-red-600',
  'text-primary': 'text-blue-600'
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
  // Memoize the trend indicator to prevent unnecessary re-renders
  const trendIndicator = useMemo(() => {
    if (!trend) return null;
    
    const trendText = trend.isPositive ? '+' : '';
    const trendColor = trend.isPositive ? 'text-green-600' : 'text-red-600';
    const trendIcon = trend.isPositive ? '↗' : '↘';
    
    return (
      <div className={`text-xs font-medium ${trendColor} flex items-center gap-1 mt-1`}>
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
        bg-white rounded-2xl p-6 transition-all duration-300 
        border-1 ${BORDER_COLOR_MAP[color]}
        ${onClick ? 'cursor-pointer hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300' : ''}
        ${loading ? 'opacity-70 animate-pulse' : ''}
      `}
      onClick={onClick}
      onKeyPress={onClick ? handleKeyPress : undefined}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? 'button' : 'figure'}
      aria-label={onClick ? `${title}: ${value}` : undefined}
    >
      <div className="flex items-center gap-4">
        <div className={`
          w-12 h-12 ${BG_COLOR_MAP[color]} rounded-xl 
          flex items-center justify-center transition-transform duration-300 
          ${onClick ? 'group-hover:scale-110' : ''}
        `}>
          <Icon className={`w-6 h-6 ${ICON_COLOR_MAP[color]}`} />
        </div>
        <div className="min-w-0 flex-1">
          {loading ? (
            <>
              <div className="h-7 bg-gray-200 rounded-md animate-pulse mb-2 w-16"></div>
              <div className="h-4 bg-gray-200 rounded-md animate-pulse w-24"></div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-900 truncate">{value}</div>
              <div className="text-sm text-gray-600 truncate">{title}</div>
              {trendIndicator}
            </>
          )}
        </div>
      </div>
    </div>
  );
};