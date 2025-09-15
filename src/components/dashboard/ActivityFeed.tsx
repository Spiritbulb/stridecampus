import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ActivityFeedProps {
  transactions: any[];
  loading: any;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ transactions }) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm text-accent hover:text-accent/80 font-medium transition-colors">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  transaction.amount > 0 ? 'bg-accent/20' : 'bg-destructive/20'
                }`}>
                  {transaction.amount > 0 ? (
                    <TrendingUp className="w-4 h-4 text-accent" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {transaction.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className={`font-semibold ${
                transaction.amount > 0 ? 'text-accent' : 'text-destructive'
              }`}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-muted-foreground">No activity yet</div>
            <div className="text-sm text-muted-foreground">Start answering surveys to see your activity</div>
          </div>
        )}
      </div>
    </div>
  );
};