'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function NoAuthNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <div className='flex items-center'>
            <img 
    src="/logo-rectangle.png" 
    alt="Stride Campus" 
    className="h-12 w-auto" 
  />
  <span className="ml-1 text-xs font-medium bg-yellow-500 text-white px-1.5 py-0.5 rounded-md">Beta</span>
  </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-[#f23b36] transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-[#f23b36] transition-colors">
              About
            </Link>
            <Link href="/features" className="text-gray-700 hover:text-[#f23b36] transition-colors">
              Features
            </Link>
            <Link href="/docs" className="text-gray-700 hover:text-[#f23b36] transition-colors">
              Docs
            </Link>
            <Link href="/support" className="text-gray-700 hover:text-[#f23b36] transition-colors">
              Support
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-[#f23b36] transition-colors">
              Contact
            </Link>
            <Link href="/donate" className="text-gray-700 hover:text-[#f23b36] transition-colors">
              Donate
            </Link>
            <Link href="/legal" className="text-gray-700 hover:text-[#f23b36] transition-colors">
              Legal
            </Link>
            <div className="flex space-x-4">
              <Link href="/download" className="px-4 py-2 rounded-md bg-[#f23b36] text-white hover:bg-[#d32f2f] transition-colors">
                Download
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[#f23b36] focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#f23b36] hover:bg-gray-50">
              Home
            </Link>
            <Link href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#f23b36] hover:bg-gray-50">
              About
            </Link>
            <Link href="/features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#f23b36] hover:bg-gray-50">
              Features
            </Link>
            <Link href="/docs" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#f23b36] hover:bg-gray-50">
              Docs
            </Link>
            <Link href="/support" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#f23b36] hover:bg-gray-50">
              Support
            </Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#f23b36] hover:bg-gray-50">
              Contact
            </Link>
            <Link href="/donate" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#f23b36] hover:bg-gray-50">
              Donate
            </Link>
            <Link href="/legal" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#f23b36] hover:bg-gray-50">
              Legal
            </Link>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex flex-col space-y-3 px-2">
                <Link href="/auth" className="w-full px-4 py-2 rounded-md text-center bg-[#f23b36] text-white hover:bg-[#d32f2f]">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}