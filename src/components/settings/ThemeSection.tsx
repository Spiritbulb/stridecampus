'use client';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle, ThemeSelector } from '@/components/ui/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ThemeSection() {
  const { theme, resolvedTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how Stride Campus looks and feels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">Theme</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your preferred color scheme
            </p>
            
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
              <div>
                <p className="font-medium text-card-foreground">Current theme</p>
                <p className="text-sm text-muted-foreground">
                  {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'} 
                  {theme === 'system' && ` (${resolvedTheme})`}
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">Quick switch</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Switch between light, dark, and system themes
            </p>
            <ThemeSelector />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Theme preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-background border border-border rounded-lg">
                <div className="w-3 h-3 bg-primary rounded-full mb-2"></div>
                <p className="text-sm text-foreground">Primary</p>
              </div>
              <div className="p-3 bg-card border border-border rounded-lg">
                <div className="w-3 h-3 bg-secondary rounded-full mb-2"></div>
                <p className="text-sm text-card-foreground">Card</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="w-3 h-3 bg-muted-foreground rounded-full mb-2"></div>
                <p className="text-sm text-muted-foreground">Muted</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
