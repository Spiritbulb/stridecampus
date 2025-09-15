import { User } from '@/utils/supabaseClient';
import { Users } from 'lucide-react';

interface FeedHeaderProps {
  user: User | null;
  onShowCreatePost: () => void;
  onShowCreateSpace: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export default function FeedHeader({ 
  user, 
  onShowCreatePost, 
  onShowCreateSpace, 
  sortBy, 
  onSortChange 
}: FeedHeaderProps) {
  return (
    <>
      {user && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name} 
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <span className="text-gray-500 font-medium">
                  {user.full_name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button 
              onClick={onShowCreatePost}
              className="flex-1 bg-gray-100 text-gray-500 rounded-full px-4 py-2 text-left hover:bg-gray-200 transition-colors"
            >
              Create a post
            </button>
            <button 
              onClick={onShowCreateSpace}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Create community"
            >
              <Users size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Sorting options */}
      <div className="bg-white rounded-lg border border-gray-200 p-2 mb-4 flex items-center gap-4">
        <button 
          className={`px-3 py-1 rounded-md text-sm font-medium ${sortBy === 'hot' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => onSortChange('hot')}
        >
          Hot
        </button>
        <button 
          className={`px-3 py-1 rounded-md text-sm font-medium ${sortBy === 'new' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => onSortChange('new')}
        >
          New
        </button>
        <button 
          className={`px-3 py-1 rounded-md text-sm font-medium ${sortBy === 'top' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => onSortChange('top')}
        >
          Top
        </button>
      </div>
    </>
  );
}