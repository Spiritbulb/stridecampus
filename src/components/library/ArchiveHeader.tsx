import React from 'react';
import { Archive, ArrowLeft } from 'lucide-react';
import { User } from '@/utils/supabaseClient';
import Link from 'next/link';

interface ArchiveHeaderProps {
  user: User;
}

export const ArchiveHeader: React.FC<ArchiveHeaderProps> = ({ user }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/library"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Library</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Archive size={32} className="text-white" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Archive</h1>
          <p className="text-gray-600 text-lg">
            Resources you've purchased and own forever
          </p>
        </div>
      </div>
    </div>
  );
};
