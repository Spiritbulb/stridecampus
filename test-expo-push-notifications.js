#!/usr/bin/env node

/**
 * Test script for Expo Push Notifications
 * This script tests the end-to-end flow of Expo push notifications
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://laqocctbodlexjkfpfwh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcW9jY3Rib2RsZXhqa2ZwZndoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODg1ODQsImV4cCI6MjA3MzA2NDU4NH0.fHrHxNNE_GrSN7QUz7Rm-lLW7E4Ym59LF9QfS7F4iHw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user ID (replace with your actual user ID)
const TEST_USER_ID = 'f5d64dc3-a684-4347-8a9c-e851fadd6ff1';

async function testExpoPushNotifications() {
  console.log('🧪 Starting Expo Push Notification Tests...\n');

  try {
    // Test 1: Check if user has Expo push token
    console.log('📱 Test 1: Checking user Expo push token...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, expo_push_token, push_notifications, full_name')
      .eq('id', TEST_USER_ID)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }

    console.log('👤 User:', user.full_name || 'Unknown');
    console.log('🔑 Expo Push Token:', user.expo_push_token ? 'Present' : 'Missing');
    console.log('🔔 Push Notifications Enabled:', user.push_notifications ? 'Yes' : 'No');

    if (!user.expo_push_token) {
      console.log('⚠️  No Expo push token found. User needs to open the mobile app to generate one.');
      return;
    }

    // Test 2: Validate token format
    console.log('\n📱 Test 2: Validating token format...');
    const isValidFormat = user.expo_push_token.startsWith('ExponentPushToken[') || 
                         user.expo_push_token.startsWith('ExpoPushToken[');
    console.log('✅ Token format valid:', isValidFormat);

    if (!isValidFormat) {
      console.log('❌ Invalid token format. Expected ExponentPushToken[...] or ExpoPushToken[...]');
      return;
    }

    // Test 3: Send test notification via Expo API
    console.log('\n📱 Test 3: Sending test notification via Expo API...');
    const expoPushMessage = {
      to: user.expo_push_token,
      sound: 'default',
      title: '🧪 Test Notification',
      body: 'This is a test notification from the Expo push service!',
      data: { 
        type: 'test',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substring(7)
      },
      channelId: 'default',
    };

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoPushMessage),
    });

    const expoResult = await expoResponse.json();
    console.log('📤 Expo API Response:', expoResult);

    if (expoResult.data && expoResult.data[0]) {
      const pushResult = expoResult.data[0];
      if (pushResult.status === 'ok') {
        console.log('✅ Expo push notification sent successfully!');
        console.log('📋 Notification ID:', pushResult.id);
      } else {
        console.log('❌ Expo push notification failed:', pushResult.message);
      }
    } else {
      console.log('❌ Unexpected response format from Expo API');
    }

    // Test 4: Send notification via our robust notification service
    console.log('\n📱 Test 4: Testing robust notification service...');
    const robustResponse = await fetch('http://localhost:3000/api/robust-push-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test',
        userInfo: {
          id: TEST_USER_ID,
          email: 'test@stridecampus.com',
          role: 'admin'
        }
      }),
    });

    if (robustResponse.ok) {
      const robustResult = await robustResponse.json();
      console.log('✅ Robust notification service response:', robustResult);
    } else {
      console.log('❌ Robust notification service failed:', await robustResponse.text());
    }

    // Test 5: Check notification delivery stats
    console.log('\n📱 Test 5: Checking notification delivery stats...');
    const statsResponse = await fetch('http://localhost:3000/api/robust-push-notifications', {
      method: 'GET',
    });

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('📊 Notification Stats:', stats.stats);
    }

    console.log('\n🎉 Expo Push Notification Tests Completed!');
    console.log('\n📋 Summary:');
    console.log('- User has Expo push token:', user.expo_push_token ? '✅' : '❌');
    console.log('- Token format is valid:', isValidFormat ? '✅' : '❌');
    console.log('- Push notifications enabled:', user.push_notifications ? '✅' : '❌');
    console.log('- Expo API test:', expoResult.data?.[0]?.status === 'ok' ? '✅' : '❌');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the tests
testExpoPushNotifications().catch(console.error);

export { testExpoPushNotifications };
