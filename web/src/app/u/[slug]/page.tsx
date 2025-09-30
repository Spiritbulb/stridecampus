import { fetchProfileData } from './server';
import UserProfileClient from './UserProfileClient';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function UserProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  // Await the params promise
  const resolvedParams = await params;
  
  // Get current user session on server (simplified approach)
  let currentUserId: string | undefined;
  
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    currentUserId = session?.user?.id;
  } catch (error) {
    console.error('Error getting server session:', error);
    // Continue without user ID - profile can still be viewed
  }
   
  const profileData = await fetchProfileData(resolvedParams.slug, currentUserId);
   
  return <UserProfileClient profileData={profileData} />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;