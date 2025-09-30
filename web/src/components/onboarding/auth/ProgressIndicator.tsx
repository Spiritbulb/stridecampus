// components/ProgressIndicator.tsx
import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  currentStep, 
  totalSteps 
}) => {
  return (
    <div className="flex justify-center mb-10">
      <div className="flex gap-3">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
          <div key={i} className="relative">
            <div
              className={`w-3 h-3 rounded-full transition-all duration-500 ${
                i <= currentStep ? 'scale-125' : 'scale-100'
              }`}
              style={{ 
                backgroundColor: i <= currentStep ? '#f23b36' : '#e5e7eb'
              }}
            />
            {i <= currentStep && (
              <div 
                className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-30"
                style={{ backgroundColor: '#f23b36' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};