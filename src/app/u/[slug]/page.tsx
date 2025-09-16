import { fetchProfileData } from './server';
import UserProfileClient from './UserProfileClient';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { userProfileCache } from '@/utils/auth';

export default async function UserProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  // Await the params promise
  const resolvedParams = await params;
  

  
  // Get current user session on server
  const user = userProfileCache.get('user')?.user
  
  const currentUserId = user?.id;

  const profileData = await fetchProfileData(resolvedParams.slug, currentUserId);

  return <UserProfileClient profileData={profileData} />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;