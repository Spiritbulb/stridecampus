'use client';
import { useEffect, useMemo, Suspense } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useSearchParams } from 'next/navigation';
import { useViewport } from '@/hooks/useViewport';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useChatManagement } from '@/hooks/useChatManagement';
import { supabase } from '@/utils/supabaseClient';

// Components
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import UserSearchScreen from '@/components/chat/UserSearchScreen';
import ChatsList from '@/components/chat/ChatsList';

interface PageProps {
  params?: Promise<{ [key: string]: string | string[] | undefined }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ChatPageContent: React.FC = () => {
  const { user } = useApp();
  const searchParams = useSearchParams();
  
  // Custom hooks
  const { isMobile, isMounted } = useViewport();
  const { searchQuery, setSearchQuery, searchResults, searchLoading, clearSearch } = useUserSearch({
    currentUserId: user?.id
  });
  
  const {
    chats,
    messages,
    activeChat,
    loading,
    newMessage,
    showChatList,
    showUserSearch,
    isInitialized,
    error,
    otherParticipant,
    messagesEndRef,
    setNewMessage,
    setShowChatList,
    setShowUserSearch,
    handleSelectChat,
    handleBackToChats,
    handleSendMessage,
    handleStartChat,
    handleStartNewChat,
    handleViewProfile,
    initializeChats,
    setError
  } = useChatManagement({
    currentUserId: user?.id || '',
    isMobile
  });

  // Get username from URL params if available
  const urlUsername = useMemo(() => searchParams?.get('username'), [searchParams]);

  // Initialize chats when user is available
  useEffect(() => {
    if (!user || !isMounted) return;
    initializeChats();
  }, [user, isMounted, initializeChats]);

  // Handle username navigation
  useEffect(() => {
    const targetUsername = urlUsername;
    if (!targetUsername || !user || !isInitialized || !chats.length) return;

    const handleUsernameNavigation = async () => {
      try {
        // Check if chat already exists
        const existingChat = chats.find(chat => 
          chat.participants.some((p) => 
            p.users?.username === targetUsername && p.user_id !== user.id
          )
        );

        if (existingChat) {
          await handleSelectChat(existingChat);
          return;
        }

        // Find user and start chat
        const { data: foundUser, error } = await supabase
          .from('users')
          .select('id, username, full_name, avatar_url')
          .eq('username', targetUsername)
          .neq('id', user.id)
          .single();

        if (error || !foundUser) {
          setSearchQuery(targetUsername);
          setShowUserSearch(true);
          return;
        }

        await handleStartChat(foundUser as any);
      } catch (error) {
        console.error('Failed to handle username navigation:', error);
        setSearchQuery(targetUsername);
        setShowUserSearch(true);
      }
    };

    handleUsernameNavigation();
  }, [urlUsername, user, isInitialized, chats, handleSelectChat, handleStartChat, setSearchQuery, setShowUserSearch]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Debug state changes
  useEffect(() => {
    // console.log('Chat page state:', {
    //   activeChat: activeChat?.id,
    //   activeChatExists: !!activeChat,
    //   otherParticipant: otherParticipant?.users?.username,
    //   showChatList,
    //   showUserSearch,
    //   isMobile,
    //   messagesCount: messages.length,
    //   newMessage: newMessage
    // });
  }, [activeChat, otherParticipant, showChatList, showUserSearch, isMobile, messages.length, newMessage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to go back
      if (e.key === 'Escape') {
        if (showUserSearch) {
          handleBackToChats();
        } else if (!showChatList && isMobile) {
          handleBackToChats();
        }
      }
      
      // Ctrl/Cmd + K to start new chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleStartNewChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUserSearch, showChatList, isMobile, handleBackToChats, handleStartNewChat]);

  // Error display component
  const ErrorDisplay = useMemo(() => {
    if (!error) return null;
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-4 mb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
                </div>
              </div>
            );
  }, [error, setError]);

  // Loading screen for unauthenticated users
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#f23b36] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-600">Please log in to access chats</p>
        </div>
      </div>
    );
  }

  // Loading screen while initializing
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f23b36]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50" role="main" aria-label="Chat application">
      {/* Error Display */}
      {ErrorDisplay}
      
      {/* Desktop Layout */}
      {!isMobile && (
        <>
          {showUserSearch ? (
            <UserSearchScreen
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchResults={searchResults}
              searchLoading={searchLoading}
              onStartChat={handleStartChat}
              onBackToChats={handleBackToChats}
              isMobile={false}
            />
          ) : (
            <ChatsList
              chats={chats}
              activeChat={activeChat}
              currentUserId={user.id}
              loading={loading}
              isInitialized={isInitialized}
              onSelectChat={handleSelectChat}
              onStartNewChat={handleStartNewChat}
              isMobile={false}
            />
          )}
          
          {/* Chat Messages Area */}
          <div className="flex-1 flex flex-col bg-white" role="region" aria-label="Chat messages">
            {!activeChat ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50/50">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p>Select a chat to start messaging</p>
                  <button
                    onClick={handleStartNewChat}
                    className="mt-4 px-4 py-2 bg-[#f23b36] text-white rounded-lg hover:bg-[#d63031] transition-colors text-sm font-medium"
                  >
                    Start new chat
                  </button>
                </div>
              </div>
            ) : (
              <>
                <ChatHeader
                  otherParticipant={otherParticipant}
                  onBackToChats={handleBackToChats}
                  onViewProfile={handleViewProfile}
                  isMobile={false}
                />
                <MessageList
                  messages={messages}
                  currentUserId={user.id}
                  loading={loading}
                  messagesEndRef={messagesEndRef}
                />
                <MessageInput
                  newMessage={newMessage}
                  onMessageChange={setNewMessage}
                  onSendMessage={handleSendMessage}
                  disabled={loading}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <>
          {showUserSearch && (
            <UserSearchScreen
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchResults={searchResults}
              searchLoading={searchLoading}
              onStartChat={handleStartChat}
              onBackToChats={handleBackToChats}
              isMobile={true}
            />
          )}
          {showChatList && !showUserSearch && (
            <ChatsList
              chats={chats}
              activeChat={activeChat}
              currentUserId={user.id}
              loading={loading}
              isInitialized={isInitialized}
              onSelectChat={handleSelectChat}
              onStartNewChat={handleStartNewChat}
              isMobile={true}
            />
          )}
          {!showChatList && !showUserSearch && activeChat && (
            <div className="fixed inset-0 z-50 flex flex-col bg-white pb-20">
              <ChatHeader
                otherParticipant={otherParticipant}
                onBackToChats={handleBackToChats}
                onViewProfile={handleViewProfile}
                isMobile={true}
              />
              <MessageList
                messages={messages}
                currentUserId={user.id}
                loading={loading}
                messagesEndRef={messagesEndRef}
              />
              <MessageInput
                newMessage={newMessage}
                onMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                disabled={loading}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ChatPage: React.FC<PageProps> = ({ params, searchParams: serverSearchParams }) => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f23b36]"></div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
};

export default ChatPage;