import React, { useState } from 'react';
import { Crown, Trophy, Medal } from 'lucide-react';
import { User } from '@/utils/supabaseClient';

interface LeaderboardProps {
  leaderboard: any[];
  currentUserId: string;
  loading: any;
  user: User;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard, currentUserId, user }) => {
  const [isCurrentUser, setCurrentUser] = useState(false);
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

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Leaderboard</h3>
        <button className="text-sm text-accent hover:text-accent/80 font-medium transition-colors">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {leaderboard.length > 0 ? (
          leaderboard.slice(0, 5).map((leader, index) => {
            if (leader.user_id === currentUserId) {
              setCurrentUser(true)
            }
            
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                  isCurrentUser
                    ? 'bg-accent/10 border border-accent/20'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getPositionIcon(leader.position || index + 1)}
                  <div className="w-8 h-8 bg-gradient-to-br from-accent to-warning rounded-full flex items-center justify-center text-white text-xs font-bold">
                    { user.username|| 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      
                      {leader.user_id === user?.id && (
                        <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                      {leader.user_id !== user?.id && (
                        <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                          {leader.username}
                        </span>
                      )}
                      
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {leader.school}
                    </div>
                  </div>
                </div>
                <div className="font-semibold text-foreground">
                  {leader.credits} credits
                </div>
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