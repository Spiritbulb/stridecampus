import React from 'react';
import { Crown, Trophy, Medal } from 'lucide-react';
import { User } from '@/utils/supabaseClient';

interface LeaderboardProps {
  leaderboard: any[];
  currentUserId: string;
  loading: any;
  user: User;
}

const getPositionIcon = (position: number) => {
  switch (position) {
    case 1: return <Crown className="w-5 h-5 text-warning" />;
    case 2: return <Trophy className="w-5 h-5 text-muted-foreground" />;
    case 3: return <Medal className="w-5 h-5 text-warning/60" />;
    default: return (
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
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
    <div className="bg-card border border-border rounded-2xl p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Leaderboard</h3>
        <button className="text-sm text-accent hover:text-accent/80 font-medium transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {leaderboard.length > 0 ? (
          leaderboard.slice(0, 5).map((leader, idx) => {
            const position = leader.position || idx + 1;
            const isCurrentUser = leader.user_id === currentUserId;

            return (
              <div
                key={leader.user_id || idx}
                className={`flex items-center justify-between p-4 rounded-xl transition-colors
                  ${isCurrentUser
                    ? 'bg-accent/10 border border-accent/20'
                    : 'bg-muted/30 hover:bg-muted/50'}
                `}
              >
                <div className="flex items-center gap-3">
                  {getPositionIcon(position)}
                  <div className="w-8 h-8 bg-gradient-to-br from-accent to-warning rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {leader?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                      {leader.username}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{leader.school}</div>
                  </div>
                </div>
                <div className="font-semibold text-foreground">{leader.credits} credits</div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="text-muted-foreground">No leaderboard data</div>
            <div className="text-sm text-muted-foreground">Be the first to earn credits!</div>
          </div>
        )}
      </div>
    </div>
  );
};
