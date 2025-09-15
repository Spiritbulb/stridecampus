import { AppProvider } from '@/contexts/AppContext';
import React from 'react';


interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showNavigation = false }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};