// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createUserFromAuth } from '@/utils/auth'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    )
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    try {
      // Exchange code for session (PKCE flow)
      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        return NextResponse.redirect(
          new URL('/auth?error=invalid_code', requestUrl.origin)
        )
      }

      if (session?.user) {
        try {
          // Check if user already exists in our users table
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single()

          // If user doesn't exist, create them in the users table
          if (!existingUser) {
            await createUserFromAuth(session.user)
          }
        } catch (userError) {
          console.error('Error handling user creation:', userError)
          // Continue redirecting even if user creation fails
        }
      }

      // Successful authentication
      return NextResponse.redirect(new URL('/arena', requestUrl.origin))

    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(
        new URL('/auth?error=unexpected_error', requestUrl.origin)
      )
    }
  }

  // If no code parameter, check for hash fragment (client-side handling)
  // This handles cases where the OAuth flow returns tokens in the hash
  const hash = requestUrl.hash.substring(1)
  if (hash.includes('access_token=')) {
    // Redirect to client-side handler
    return NextResponse.redirect(
      new URL(`/auth/handler${requestUrl.search}${requestUrl.hash}`, requestUrl.origin)
    )
  }

  // No valid authentication data found
  return NextResponse.redirect(
    new URL('/auth?error=no_auth_data', requestUrl.origin)
  )
}