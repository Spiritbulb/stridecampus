import React from 'react';
import { TrendingUp, TrendingDown, Gift, RefreshCw, Award, Coins } from 'lucide-react';
import { CreditTransaction } from '@/utils/supabaseClient';

interface ActivityFeedProps {
  transactions: CreditTransaction[];
  loading: boolean;
  error?: string | null;
  onViewAll?: () => void;
}

const getTransactionIcon = (type: string, amount: number) => {
  if (amount > 0) {
    switch (type) {
      case 'earned':
        return <Coins className="w-4 h-4 text-green-600 drop-shadow-sm" />;
      case 'bonus':
        return <Gift className="w-4 h-4 text-orange-600 drop-shadow-sm" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-blue-600 drop-shadow-sm" />;
      default:
        return <TrendingUp className="w-4 h-4 text-green-600 drop-shadow-sm" />;
    }
  } else {
    return <TrendingDown className="w-4 h-4 text-red-600 drop-shadow-sm" />;
  }
};

const getTransactionColor = (type: string, amount: number) => {
  if (amount > 0) {
    switch (type) {
      case 'earned':
        return 'bg-green-100 ring-2 ring-white shadow-md';
      case 'bonus':
        return 'bg-orange-100 ring-2 ring-white shadow-md';
      case 'refund':
        return 'bg-blue-100 ring-2 ring-white shadow-md';
      default:
        return 'bg-green-100 ring-2 ring-white shadow-md';
    }
  } else {
    return 'bg-red-100 ring-2 ring-white shadow-md';
  }
};

const formatTransactionAmount = (amount: number) => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  } else {
    return amount.toString();
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  } else if (diffInMinutes < 10080) {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  transactions, 
  loading, 
  error,
  onViewAll 
}) => {
  if (loading) {
    return (
      <div className="bg-white border-2 border-[#f23b36] rounded-2xl p-6 max-w-xl mx-auto shadow-lg shadow-[#f23b36]/10 transition-all duration-300 hover:shadow-xl hover:shadow-[#f23b36]/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Award className="h-6 w-auto text-[#f23b36]"/>
            Recent Activity
          </h3>
        </div>
        
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                <div>
                  <div className="w-32 h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-12 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-[#f23b36] rounded-2xl p-6 max-w-xl mx-auto shadow-lg shadow-[#f23b36]/10 transition-all duration-300 hover:shadow-xl hover:shadow-[#f23b36]/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Award className="h-6 w-auto text-[#f23b36]"/>
            Recent Activity
          </h3>
        </div>
        
        <div className="text-center py-8 animate-fade-in">
          <div className="text-red-500 text-lg mb-2">Failed to load activity</div>
          <div className="text-sm text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-[#f23b36] rounded-2xl p-6 max-w-xl mx-auto shadow-lg shadow-[#f23b36]/10 transition-all duration-300 hover:shadow-xl hover:shadow-[#f23b36]/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Award className="h-6 w-auto text-[#f23b36]"/>
          Recent Activity
        </h3>
        {transactions.length > 5 && (
          <button 
            onClick={onViewAll}
            className="text-sm text-[#f23b36] hover:text-[#f23b36]/80 font-medium transition-all duration-200 hover:scale-105"
          >
            View All
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map((transaction, idx) => (
            <div 
              key={transaction.id} 
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md
                ${transaction.amount > 0 
                  ? 'bg-green-50 hover:bg-green-100 border border-green-200' 
                  : 'bg-red-50 hover:bg-red-100 border border-red-200'}
              `}
              style={{
                animationDelay: `${idx * 100}ms`,
                animation: `slideIn 0.5s ease-out ${idx * 100}ms both`
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 ${
                  getTransactionColor(transaction.type, transaction.amount)
                }`}>
                  {getTransactionIcon(transaction.type, transaction.amount)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {transaction.description}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{formatDate(transaction.created_at)}</span>
                    {transaction.type && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{transaction.type}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className={`font-semibold bg-gradient-to-r ${
                transaction.amount > 0 
                  ? 'from-green-600 to-green-500' 
                  : 'from-red-600 to-red-500'
              } bg-clip-text text-transparent`}>
                {transaction.amount > 0 ? '+' : ''}{formatTransactionAmount(transaction.amount)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 animate-fade-in">
            <div className="text-gray-500 text-lg mb-2">No activity yet</div>
            <div className="text-sm text-gray-400">
              Start earning credits to see your activity here
            </div>
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