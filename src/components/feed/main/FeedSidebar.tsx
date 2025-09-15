import { Space } from '@/utils/supabaseClient';
import { User } from '@/utils/supabaseClient';
import { useMemberCounts } from './deps/sidebar';
import { Globe, Lock, Users, ChevronDown, Plus, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface FeedSidebarProps {
  spaces: Space[];
  onJoinSpace: (spaceId: string) => void;
  user: User | null;
  onCreateSpace?: () => void;
}


export default function FeedSidebar({ spaces, onJoinSpace, user, onCreateSpace }: FeedSidebarProps) {
  const [showAllSpaces, setShowAllSpaces] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get member counts for all spaces at the top level
  const { memberCounts } = useMemberCounts(spaces);

  // Filter spaces based on search query
  const filteredSpaces = spaces.filter(space => 
    space.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Spaces to display (either all or limited)
  const displaySpaces = showAllSpaces ? filteredSpaces : filteredSpaces.slice(0, 5);

  return (
    <div className="w-full lg:w-80 space-y-4">
      {/* Search and Create Space */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-lg">Spaces</h2>
            <button
              onClick={onCreateSpace}
              className="flex items-center text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
            >
              <Plus size={14} className="mr-1" />
              Create
            </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Spaces list */}
        <div className="space-y-3">
          {displaySpaces.length > 0 ? (
            displaySpaces.map(space => (
              
              <div key={space.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <a href={`/spaces/${space.id}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${space.is_public ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {space.logo_url && (
                      <img src={`${space.logo_url}`} className='w-full h-full object-contain'/>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{space.display_name}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Users size={12} className="mr-1" />
                      {memberCounts[space.id]} members
                      {space.is_public ? ' • Public' : ' • Private'}
                    </div>
                  </div>
                </div>
                {user && !space.user_role && space.is_public && (
                  <button
                    onClick={() => onJoinSpace(space.id)}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Join
                  </button>
                )}
                {space.creator_id === user?.id && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Admin
                  </span>
                )}
                {space.creator_id != user?.id && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Member
                  </span>
                )}
                </a>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No spaces found{searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}
        </div>
        
        {/* View more/fewer button */}
        {filteredSpaces.length > 5 && (
          <button 
            onClick={() => setShowAllSpaces(!showAllSpaces)}
            className="w-full mt-4 text-sm text-blue-600 font-medium hover:text-blue-800 hover:bg-blue-50 py-2 rounded-lg transition-colors flex items-center justify-center"
          >
            {showAllSpaces ? (
              <>
                <ChevronDown size={16} className="mr-1 transform rotate-180" />
                Show fewer
              </>
            ) : (
              <>
                <ChevronDown size={16} className="mr-1" />
                View all spaces ({filteredSpaces.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* About card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Here's how Spaces work</h2>
        </div>
        <p className="text-sm text-gray-700 mb-3">
          Discover and share educational resources, ask questions, and connect with other students in your academic community.
        </p>
        <p className='text-sm text-gray-700 mb-3'>
          You can create your own private Space for you and close friends, or a public one for anyone to join!
        </p>
        <a href='/support/spaces' className="inline-block">
          <span className='text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors'>
            Learn more about Spaces
          </span>
        </a>
      </div>

      {/* Stats card (if user is logged in) */}
      {user && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Your Spaces</h3>
          <div className="flex justify-between text-sm">
            <div>
              <div className="text-gray-600">Joined</div>
              <div className="font-bold text-gray-900">
                {spaces.filter(space => space.user_role).length}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Available</div>
              <div className="font-bold text-gray-900">{spaces.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}