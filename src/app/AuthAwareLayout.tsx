// components/layout/AuthAwareLayout.tsx
'use client';

import { useApp } from '@/contexts/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import AppSidebar from '@/components/sidebar/AppSidebar';
import NoAuthNavbar from '@/components/layout/NoAuthNavbar';
import NoAuthFooter from '@/components/layout/NoAuthFooter';

interface AuthAwareLayoutProps {
  children: React.ReactNode;
}

export function AuthAwareLayout({ children }: AuthAwareLayoutProps) {
  const { isAuthenticated } = useApp();

  return (
    <>
    {isAuthenticated ? <Navbar /> : <NoAuthNavbar /> }
      
      
      {/* Main Content Area - adjust margins based on auth */}
      <div 
        id="root" 
        className={`transition-all duration-300 ${
          isAuthenticated ? 'md:ml-20 md:mr-90' : 'md:mx-0'
        }`}
      >
        {children}
      </div>
      
      {/* Conditionally render sidebars based on auth */}
      {isAuthenticated && <AppSidebar />}
      
      {isAuthenticated ? <Footer /> : <NoAuthFooter /> }
    </>
  );
}