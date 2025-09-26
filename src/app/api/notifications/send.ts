import { type NextApiRequest, type NextApiResponse } from 'next';
import { supabase } from '@/utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, title, body, data } = req.body;

    // 1. First, create the notification in your database
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        body,
        data: data || {},
        is_read: false
      })
      .select()
      .single();

    if (notifError) throw notifError;

    // 2. Get the user's Expo push token from the database
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_push_tokens')
      .select('expo_push_token')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData) {
      // User doesn't have a push token (maybe using web only)
      return res.status(200).json({ 
        success: true, 
        message: 'Notification saved, but no push token found' 
      });
    }

    // 3. Send push notification via Expo's API
    const message = {
      to: tokenData.expo_push_token,
      sound: 'default',
      title,
      body,
      data: {
        notificationId: notification.id,
        ...data
      },
    };

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const expoResult = await expoResponse.json();

    if (expoResult.data?.status === 'error') {
      console.error('Expo push error:', expoResult.data.message);
    }

    res.status(200).json({ 
      success: true, 
      notification,
      expoResponse: expoResult 
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}