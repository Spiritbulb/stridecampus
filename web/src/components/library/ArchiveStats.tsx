import React from 'react';
import { Coins, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface ArchiveStatsProps {
  stats: {
    totalPurchased: number;
    totalSpent: number;
    averageCost: number;
    recentPurchases: number;
  };
}

export const ArchiveStats: React.FC<ArchiveStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Purchased',
      value: stats.totalPurchased,
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100'
    },
    {
      title: 'Total Spent',
      value: `${stats.totalSpent} credits`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100'
    },
    {
      title: 'Average Cost',
      value: `${stats.averageCost} credits`,
      icon: Coins,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'from-amber-50 to-amber-100'
    },
    {
      title: 'Recent Purchases',
      value: stats.recentPurchases,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`bg-gradient-to-br ${stat.bgColor} rounded-2xl p-6 border border-gray-200/50 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <stat.icon size={24} className="text-white" />
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600 font-medium">
              {stat.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
