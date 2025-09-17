import React from 'react';
import { Crown, Trophy, Medal, BarChart2 } from 'lucide-react';
import { User } from '@/utils/supabaseClient';

interface LeaderboardProps {
  leaderboard: any[];
  currentUserId: string;
  loading: any;
  user: User;
}

const getPositionIcon = (position: number) => {
  switch (position) {
    case 1: return <Crown className="w-5 h-5 text-yellow-400 drop-shadow-sm animate-pulse" />;
    case 2: return <Trophy className="w-5 h-5 text-gray-400 drop-shadow-sm" />;
    case 3: return <Medal className="w-5 h-5 text-yellow-600 drop-shadow-sm" />;
    default: return (
      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
        {position}
      </div>
    );
  }
};

export const Leaderboard: React.FC<LeaderboardProps> = ({
  leaderboard,
  currentUserId,
  user,
}) => {
  return (
    <div className="bg-white border-2 border-[#f23b36] rounded-2xl p-6 max-w-xl mx-auto shadow-lg shadow-[#f23b36]/10 transition-all duration-300 hover:shadow-xl hover:shadow-[#f23b36]/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <BarChart2 className="h-6 w-auto text-[#f23b36]"/>
          Leaderboard
        </h3>
        <button className="text-sm text-[#f23b36] hover:text-[#f23b36]/80 font-medium transition-all duration-200 hover:scale-105">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {leaderboard.length > 0 ? (
          leaderboard.slice(0, 5).map((leader, idx) => {
            const position = leader.position || idx + 1;
            const isCurrentUser = leader.id === currentUserId;

            return (
              <div
                key={leader.user_id || idx}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md
                  ${isCurrentUser
                    ? 'bg-[#f23b36]/10 border-2 border-[#f23b36]/30 shadow-sm animate-pulse'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}
                `}
                style={{
                  animationDelay: `${idx * 100}ms`,
                  animation: `slideIn 0.5s ease-out ${idx * 100}ms both`
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="transition-transform duration-200 hover:scale-110">
                    {getPositionIcon(position)}
                  </div>
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-md transition-transform duration-200 hover:scale-110">
                    {leader.avatar ? (
                      <img src={leader.avatar} className='w-8 h-8 object-cover' alt="Avatar" />
                    ) : (
                      <img src='/default-avatar.png' className='w-8 h-8 object-cover' alt="Default Avatar" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                      <a href={`/u/${leader.username}`} className='hover:underline hover:text-[#f23b36] transition-colors duration-200'>
                        @{leader.username}{leader.checkmark && <img src='/check.png' className='w-3 h-3 ml-1 mb-1 inline'/>}
                      </a>
                      {leader.id === currentUserId && (
                        <span className="ml-1 text-xs bg-[#f23b36] text-white px-2 py-0.5 rounded-full shadow-sm">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{leader.school}</div>
                  </div>
                </div>
                <div className="font-semibold text-gray-800 bg-gradient-to-r from-[#f23b36] to-[#f23b36]/80 bg-clip-text text-transparent">
                  {leader.credits} credits
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 animate-fade-in">
            <div className="text-gray-500 text-lg mb-2">No leaderboard data</div>
            <div className="text-sm text-gray-400">Be the first to earn credits!</div>
          </div>
        )}
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
      `}</style>
    </div>
  );
};