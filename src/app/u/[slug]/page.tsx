import { fetchProfileData } from './server';
import UserProfileClient from './UserProfileClient';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function UserProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  // Await the params promise
  const resolvedParams = await params;
  
  // Create a Supabase client configured to use cookies
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => Promise.resolve(cookieStore) });
  
  // Get current user session on server
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
  }
  
  const currentUserId = session?.user?.id;

  const profileData = await fetchProfileData(resolvedParams.slug, currentUserId);

  return <UserProfileClient profileData={profileData} />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;