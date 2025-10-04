'use client';
import FeedSidebar from "../feed/main/FeedSidebar";
import { useState, useCallback } from "react";
import { usePostActions } from "@/hooks/usePostActions";
import { useFeedData } from "@/hooks/useFeedData";
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import DesktopFooter from "../layout/DesktopFooter";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

export default function AppSidebar() {
  const { user: appUser, isAuthenticated } = useApp();
  const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('new');
  const router = useRouter();

  const { posts, spaces, isLoading: feedLoading, refetch } = useFeedData(
    selectedSpace, 
    sortBy, 
    user?.email || null
  );
        
  const { handleVote, handleShare, joinSpace } = usePostActions(
    user || null, 
    refetch
  );

  const openCreateSpace = useCallback(() => {
    router.push('/create?type=space');
  }, [router]);

  // Don't render anything if user is not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <aside className="hidden md:block fixed top-0 right-0 h-full w-90 border-l border-gray-200 overflow-y-auto z-30">
      <div className="p-4 pt-6">
        <FeedSidebar 
          onJoinSpace={joinSpace} 
          onCreateSpace={openCreateSpace} 
          user={user} 
          spaces={spaces}
        />
        <DesktopFooter/>
      </div>
    </aside>
  );
}