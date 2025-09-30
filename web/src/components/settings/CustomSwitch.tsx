'use client';
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function CustomSwitch({ checked, onCheckedChange, disabled, className }: CustomSwitchProps) {
  return (
    <div className={cn("relative", className)}>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "data-[state=checked]:bg-[#f23b36] data-[state=checked]:border-[#f23b36]",
          "focus-visible:ring-[#f23b36] focus-visible:ring-offset-2",
          "transition-all duration-200"
        )}
      />
    </div>
  );
}



