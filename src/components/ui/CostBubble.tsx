import React from 'react';
import { Coins } from 'lucide-react';

interface CostBubbleProps {
  cost: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const CostBubble: React.FC<CostBubbleProps> = ({ 
  cost, 
  className = '', 
  size = 'md',
  showIcon = true 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <div className={`
      inline-flex items-center
      bg-gradient-to-r from-amber-500 to-orange-500
      text-white font-semibold rounded-full
      shadow-sm border border-amber-400/20
      ${sizeClasses[size]}
      ${className}
    `}>
      {showIcon && (
        <Coins 
          size={iconSizes[size]} 
          className="text-amber-100" 
        />
      )}
      <span className="text-white">{cost}</span>
    </div>
  );
};

// Wrapper component for positioning cost bubbles on UI elements
interface CostBubbleWrapperProps {
  cost: number;
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CostBubbleWrapper: React.FC<CostBubbleWrapperProps> = ({
  cost,
  children,
  position = 'top-right',
  className = '',
  size = 'sm'
}) => {
  const positionClasses = {
    'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
    'top-left': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
    'bottom-left': 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      <div className={`absolute ${positionClasses[position]} z-10`}>
        <CostBubble cost={cost} size={size} />
      </div>
    </div>
  );
};
