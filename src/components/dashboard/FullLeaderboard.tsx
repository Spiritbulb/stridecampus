import React, { useEffect, useRef } from 'react';
import { Crown, Trophy, Medal, BarChart2, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { User } from '@/utils/supabaseClient';

interface FullLeaderboardProps {
  leaderboard: any[];
  currentUserId: string;
  user: User;
}

const getPositionIcon = (position: number) => {
  switch (position) {
    case 1: return <Crown className="w-6 h-6 text-yellow-400 drop-shadow-sm animate-pulse" />;
    case 2: return <Trophy className="w-6 h-6 text-gray-400 drop-shadow-sm" />;
    case 3: return <Medal className="w-6 h-6 text-yellow-600 drop-shadow-sm" />;
    default: return (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shadow-sm">
        {position}
      </div>
    );
  }
};

const getRankChangeIcon = (change: number) => {
  if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
  if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

export const FullLeaderboard: React.FC<FullLeaderboardProps> = ({
  leaderboard,
  currentUserId,
  user,
}) => {
  const currentUserRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current user position on component mount
  useEffect(() => {
    if (currentUserRef.current && containerRef.current) {
      // Wait for animations to complete
      const timer = setTimeout(() => {
        const container = containerRef.current;
        const currentUserElement = currentUserRef.current;
        
        if (container && currentUserElement) {
          const containerHeight = container.clientHeight;
          const elementTop = currentUserElement.offsetTop;
          const elementHeight = currentUserElement.clientHeight;
          
          // Calculate scroll position to center the user
          const scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
          
          container.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      }, 1000); // Wait for initial animations

      return () => clearTimeout(timer);
    }
  }, [leaderboard]);

  // Find current user's position
  const currentUserPosition = leaderboard.findIndex(entry => entry.id === currentUserId) + 1;

  return (
    <div className="bg-white border-2 border-[#f23b36] rounded-2xl shadow-lg shadow-[#f23b36]/10">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <BarChart2 className="h-8 w-auto text-[#f23b36]"/>
            Global Leaderboard
          </h2>
          <div className="text-sm text-gray-600">
            {leaderboard.length} users ranked
          </div>
        </div>
        
        {/* Current User Summary */}
        <div className="mt-4 p-4 bg-[#f23b36]/5 rounded-xl border border-[#f23b36]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#f23b36] shadow-md">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className='w-10 h-10 object-cover' alt="Your Avatar" />
                ) : (
                  <img src='/default-avatar.png' className='w-10 h-10 object-cover' alt="Default Avatar" />
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-800 flex items-center gap-2">
                  @{user.username}
                  {user.checkmark && <img src='/check.png' className='w-4 h-4'/>}
                </div>
                <div className="text-sm text-gray-600">{user.school_name || 'Unknown School'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[#f23b36]">#{currentUserPosition}</div>
              <div className="text-sm text-gray-600">{user.credits} credits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div 
        ref={containerRef}
        className="max-h-[600px] overflow-y-auto scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="p-6 space-y-3">
          {leaderboard.length > 0 ? (
            leaderboard.map((leader, idx) => {
              const position = leader.position || idx + 1;
              const isCurrentUser = leader.id === currentUserId;

              return (
                <div
                  key={leader.id || idx}
                  ref={isCurrentUser ? currentUserRef : null}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md
                    ${isCurrentUser
                      ? 'bg-[#f23b36]/10 border-2 border-[#f23b36]/30 shadow-lg scale-105 relative z-10'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}
                  `}
                  style={{
                    animationDelay: `${idx * 50}ms`,
                    animation: `slideIn 0.5s ease-out ${idx * 50}ms both`
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="transition-transform duration-200 hover:scale-110">
                      {getPositionIcon(position)}
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-md transition-transform duration-200 hover:scale-110">
                      {leader.avatar ? (
                        <img src={leader.avatar} className='w-12 h-12 object-cover' alt="Avatar" />
                      ) : (
                        <img src='/default-avatar.png' className='w-12 h-12 object-cover' alt="Default Avatar" />
                      )}
                    </div>
                    <div>
                      <div className="text-base font-medium text-gray-800 flex items-center gap-2">
                        <a 
                          href={`/u/${leader.username}`} 
                          className='hover:underline hover:text-[#f23b36] transition-colors duration-200'
                        >
                          @{leader.username}
                          {leader.checkmark && <img src='/check.png' className='w-4 h-4 ml-1 mb-1 inline'/>}
                        </a>
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-[#f23b36] text-white px-2 py-1 rounded-full shadow-sm font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{leader.school}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800 bg-gradient-to-r from-[#f23b36] to-[#f23b36]/80 bg-clip-text text-transparent">
                      {leader.credits.toLocaleString()} credits
                    </div>
                    <div className="text-xs text-gray-500">
                      Rank #{position}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <div className="text-gray-500 text-xl mb-2">No leaderboard data</div>
              <div className="text-sm text-gray-400">Be the first to earn credits!</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
        <div className="text-center text-sm text-gray-600">
          Rankings are updated in real-time based on credits earned
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        /* Custom scrollbar styling */
        .scroll-smooth::-webkit-scrollbar {
          width: 8px;
        }

        .scroll-smooth::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .scroll-smooth::-webkit-scrollbar-thumb {
          background: #f23b36;
          border-radius: 4px;
        }

        .scroll-smooth::-webkit-scrollbar-thumb:hover {
          background: #d32f2f;
        }
      `}</style>
    </div>
  );
};
