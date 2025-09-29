import { useCallback, useMemo } from 'react';
import { useMessageStore } from './useMessageStore';

/**
 * Hook for managing chat sessions with additional utilities
 */
export const useChatSessions = (userId?: string) => {
  const messageStore = useMessageStore(userId);

  // Create a new chat with a custom title
  const createNamedChat = useCallback((title: string) => {
    return messageStore.createSession(title);
  }, [messageStore]);

  // Create a new chat with an auto-generated title based on first message
  const createAutoNamedChat = useCallback(() => {
    return messageStore.createSession();
  }, [messageStore]);

  // Get recent chats (last 7 days)
  const getRecentChats = useCallback((days: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return messageStore.sessions.filter(session => 
      session.updatedAt > cutoffDate
    );
  }, [messageStore.sessions]);

  // Search chats by title or message content
  const searchChats = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    
    return messageStore.sessions.filter(session => {
      // Search in title
      if (session.title.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in message content
      return session.messages.some(message => 
        message.content.toLowerCase().includes(lowercaseQuery)
      );
    });
  }, [messageStore.sessions]);

  // Get chat statistics
  const getChatStats = useCallback(() => {
    const totalMessages = messageStore.sessions.reduce(
      (sum, session) => sum + session.messageCount, 
      0
    );
    
    const averageMessagesPerChat = messageStore.sessions.length > 0 
      ? Math.round(totalMessages / messageStore.sessions.length)
      : 0;
    
    const mostActiveChat = messageStore.sessions.reduce(
      (most, current) => current.messageCount > most.messageCount ? current : most,
      messageStore.sessions[0] || { messageCount: 0 }
    );
    
    const oldestChat = messageStore.sessions.reduce(
      (oldest, current) => current.createdAt < oldest.createdAt ? current : oldest,
      messageStore.sessions[0] || { createdAt: new Date() }
    );
    
    return {
      totalChats: messageStore.sessions.length,
      totalMessages,
      averageMessagesPerChat,
      mostActiveChat: mostActiveChat.messageCount > 0 ? mostActiveChat : null,
      oldestChat: oldestChat.createdAt ? oldestChat : null,
    };
  }, [messageStore.sessions]);

  // Export all chats as JSON
  const exportAllChats = useCallback(() => {
    return messageStore.exportSessions();
  }, [messageStore]);

  // Import chats from JSON
  const importChats = useCallback((importedData: any[]) => {
    try {
      importedData.forEach(chatData => {
        const sessionId = chatData.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Convert timestamps back to Date objects
        const session = {
          id: sessionId,
          title: chatData.title || 'Imported Chat',
          messages: chatData.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
          createdAt: new Date(chatData.createdAt),
          updatedAt: new Date(chatData.updatedAt),
          isActive: false,
          messageCount: chatData.messages.length,
        };
        
        // Add to message store (this will trigger localStorage update)
        messageStore.sessions.push(session);
      });
      
      return { success: true, imported: importedData.length };
    } catch (error) {
      console.error('Error importing chats:', error as Error);
      return { success: false, error: error as Error };
    }
  }, [messageStore]);

  // Clean up old chats (older than specified days)
  const cleanupOldChats = useCallback((days: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const oldChats = messageStore.sessions.filter(session => 
      session.updatedAt < cutoffDate && !session.isActive
    );
    
    oldChats.forEach(chat => {
      messageStore.deleteSession(chat.id);
    });
    
    return { cleaned: oldChats.length };
  }, [messageStore]);

  // Get chat insights
  const getChatInsights = useCallback(() => {
    const stats = getChatStats();
    const recentChats = getRecentChats(7);
    
    const insights = {
      // Activity insights
      isActiveUser: recentChats.length > 0,
      chatFrequency: recentChats.length / 7, // chats per day
      
      // Content insights
      averageChatLength: stats.averageMessagesPerChat,
      longestConversation: stats.mostActiveChat?.messageCount || 0,
      
      // Time insights
      daysSinceLastChat: messageStore.sessions.length > 0 
        ? Math.floor((Date.now() - Math.max(...messageStore.sessions.map(s => s.updatedAt.getTime()))) / (1000 * 60 * 60 * 24))
        : null,
      
      // Engagement insights
      totalEngagement: stats.totalMessages,
      chatRetention: messageStore.sessions.length > 0 ? 'good' : 'new_user',
    };
    
    return insights;
  }, [messageStore.sessions, getChatStats, getRecentChats]);

  return {
    // Core message store functionality
    ...messageStore,
    
    // Additional utilities
    createNamedChat,
    createAutoNamedChat,
    getRecentChats,
    searchChats,
    getChatStats,
    exportAllChats,
    importChats,
    cleanupOldChats,
    getChatInsights,
  };
};
