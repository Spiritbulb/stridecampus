import React from 'react';

interface OnlineStatusProps {
  isOnline: boolean;
  lastSeen?: string;
  username: string;
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({ isOnline, lastSeen, username }) => {
  const getStatusText = () => {
    if (isOnline) {
      return 'Online';
    } else if (lastSeen) {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      } else if (diffInMinutes < 1440) { // Less than 24 hours
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours}h ago`;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        return `${days}d ago`;
      }
    }
    return 'Offline';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
      <span className="text-sm text-gray-500">{getStatusText()}</span>
    </div>
  );
};

export default OnlineStatus;
