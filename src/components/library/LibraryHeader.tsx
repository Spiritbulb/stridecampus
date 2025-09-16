import React from 'react';
import { Plus } from 'lucide-react';
import { User } from './types';

interface LibraryHeaderProps {
  user: User | null;
  onUploadClick: () => void;
}

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({ user, onUploadClick }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl p-8 mb-8 shadow-sm border border-gray-100">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-30 transform translate-x-32 -translate-y-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-100 to-yellow-100 rounded-full opacity-20 transform -translate-x-24 translate-y-24"></div>
      
      <div className="relative flex flex-col lg:flex-row justify-between items-center gap-8">
        {/* Image Section */}
        <div className="flex justify-center items-center order-2 lg:order-1">
          <div className="relative group">
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
            <img 
              src='/undraw_asset-selection_jrie.svg' 
              className='h-64 w-auto object-contain transform group-hover:scale-105 transition-transform duration-500 relative z-10' 
              alt='Pick a resource' 
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="text-center lg:text-left order-1 lg:order-2 flex-1">
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-gray-800 via-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
              Resource Library
            </h1>
            <p className="text-gray-600 text-xl lg:text-2xl font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Discover and share learning materials with your community
            </p>
            <div className="flex justify-center lg:justify-start">
              <div className="w-24 h-1 bg-gradient-to-r from-[#f23b36] to-pink-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Upload Button Section */}
        {user && (
          <div className="order-3">
            <button
              onClick={onUploadClick}
              className="group relative overflow-hidden flex gap-3 px-8 py-4 bg-gradient-to-r from-[#f23b36] to-[#e12a24] text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 justify-center items-center min-w-[200px]"
            >
              {/* Button background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#e12a24] to-[#f23b36] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
              
              {/* Button content */}
              <div className="relative flex items-center gap-3">
                <Plus 
                  size={22} 
                  className="transform group-hover:rotate-90 transition-transform duration-300" 
                />
                <span className="group-hover:tracking-wide transition-all duration-300">
                  Upload Resource
                </span>
              </div>
              
              {/* Pulse effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-white/10 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};