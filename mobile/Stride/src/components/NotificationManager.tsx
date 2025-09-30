import React, { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabaseClient';

interface NotificationManagerProps {
  webViewRef: React.RefObject<any>;
  onTokenChange: (token: string, isRegistered: boolean) => void;
  onPermissionChange: (permission: string) => void;
  userId: string | null;
}

export default function NotificationManager({ 
  webViewRef, 
  onTokenChange, 
  onPermissionChange, 
  userId 
}: NotificationManagerProps) {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [isTokenRegistered, setIsTokenRegistered] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  // Enhanced notification handler with better error handling and logging
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('🔔 Notification received in app:', notification);
        
        // Log notification details for debugging
        const { title, body, data } = notification.request.content;
        console.log('📱 Notification details:', { title, body, data });
        
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  }, []);

  // Enhanced push notification registration with better error handling and automatic sync
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log('🚀 Initializing push notifications...');
        
        // Check if we have a stored token first
        const storedToken = await AsyncStorage.getItem('expoPushToken');
        if (storedToken) {
          console.log('📱 Found stored push token:', storedToken);
          setExpoPushToken(storedToken);
          setIsTokenRegistered(true);
          onTokenChange(storedToken, true);
          
          // Validate stored token by checking if it's still valid
          const isValid = await validateStoredToken(storedToken);
          if (isValid) {
            console.log('✅ Stored token is valid, using cached token');
            return;
          } else {
            console.log('⚠️ Stored token is invalid, generating new one');
          }
        }
        
        // Register for push notifications
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
          setIsTokenRegistered(true);
          onTokenChange(token, true);
          console.log('✅ Push token registered successfully:', token);
          
          // Store token locally for persistence
          await AsyncStorage.setItem('expoPushToken', token);
          await AsyncStorage.setItem('tokenTimestamp', new Date().toISOString());
          
          // Automatically sync token to database if user is logged in
          await syncTokenToDatabase(token);
        } else {
          console.warn('⚠️ Failed to get push token');
        }
      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Enhanced notification listeners with better logging
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received (foreground):', notification);
      
      // Send notification data to WebView for processing
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'NOTIFICATION_RECEIVED',
          notification: {
            title: notification.request.content.title,
            body: notification.request.content.body,
            data: notification.request.content.data,
            timestamp: new Date().toISOString(),
          }
        }));
      }
    });

    // Enhanced notification response listener
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 Notification tapped:', response);
      
      const notificationData = response.notification.request.content.data;
      
      // Handle different notification types
      if (notificationData?.type) {
        switch (notificationData.type) {
          case 'message':
            // Navigate to chat
            if (webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({
                type: 'NAVIGATE_TO_URL',
                url: '/chats'
              }));
            }
            break;
          case 'follow':
            // Navigate to profile
            if (notificationData.senderId && webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({
                type: 'NAVIGATE_TO_URL',
                url: `/u/${notificationData.senderId}`
              }));
            }
            break;
          case 'event':
            // Navigate to events or arena
            if (webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({
                type: 'NAVIGATE_TO_URL',
                url: '/arena'
              }));
            }
            break;
          default:
            // Generic navigation
            if (notificationData.url && webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({
                type: 'NAVIGATE_TO_URL',
                url: notificationData.url
              }));
            }
        }
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Set up realtime database listener for notifications
  useEffect(() => {
    if (!userId) return;

    console.log('🔔 Setting up realtime notification listener for user:', userId);
    
    const subscription = supabase
      .channel('mobile-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('🔔 New notification received from database:', payload);
          
          const notification = payload.new as any;
          
          // Send local notification using Expo
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: notification.title,
                body: notification.message,
                data: {
                  type: notification.type,
                  notificationId: notification.id,
                  senderId: notification.sender_id,
                  timestamp: notification.created_at,
                  ...notification.data
                }
              },
              trigger: null, // Send immediately
            });
            
            console.log('✅ Local notification sent for database notification:', notification.id);
          } catch (error) {
            console.error('❌ Error sending local notification:', error);
          }
          
          // Also send to WebView for in-app processing
          if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'DATABASE_NOTIFICATION_RECEIVED',
              notification: {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                is_read: notification.is_read,
                created_at: notification.created_at,
                sender_id: notification.sender_id
              }
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Realtime notification subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to realtime notifications');
        }
      });

    return () => {
      console.log('🔔 Unsubscribing from realtime notifications');
      subscription.unsubscribe();
    };
  }, [userId]);

  // Periodic token refresh to ensure tokens stay valid
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const storedToken = await AsyncStorage.getItem('expoPushToken');
        if (storedToken) {
          const isValid = await validateStoredToken(storedToken);
          if (!isValid) {
            console.log('🔄 Refreshing expired push token...');
            const newToken = await registerForPushNotificationsAsync();
            if (newToken) {
              setExpoPushToken(newToken);
              setIsTokenRegistered(true);
              onTokenChange(newToken, true);
              await AsyncStorage.setItem('expoPushToken', newToken);
              await AsyncStorage.setItem('tokenTimestamp', new Date().toISOString());
              await syncTokenToDatabase(newToken);
              
              // Notify WebView of token refresh
              if (webViewRef.current) {
                webViewRef.current.postMessage(JSON.stringify({
                  type: 'TOKEN_REFRESHED',
                  token: newToken,
                  timestamp: new Date().toISOString()
                }));
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in periodic token refresh:', error);
      }
    }, 30 * 60 * 1000); // Check every 30 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  // Helper function to validate stored token
  async function validateStoredToken(token: string): Promise<boolean> {
    try {
      // Check if token format is valid
      if (!token || (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken['))) {
        return false;
      }
      
      // Check if token is not too old (refresh every 24 hours)
      const tokenTimestamp = await AsyncStorage.getItem('tokenTimestamp');
      if (tokenTimestamp) {
        const tokenAge = Date.now() - new Date(tokenTimestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (tokenAge > maxAge) {
          console.log('🕒 Token is too old, needs refresh');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating stored token:', error);
      return false;
    }
  }

  // Helper function to sync token to database
  async function syncTokenToDatabase(token: string) {
    try {
      console.log('🔄 Starting token sync to database...');
      console.log('📱 Token to sync:', token);
      
      // Get current user from Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Error getting session:', sessionError);
        return;
      }
      
      if (session?.user) {
        console.log('🔄 Syncing push token to database for user:', session.user.id);
        console.log('📱 Token being synced:', token);
        
        const { data, error } = await supabase
          .from('users')
          .update({ 
            expo_push_token: token,
            push_notifications: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id)
          .select();

        if (error) {
          console.error('❌ Error syncing token to database:', error);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));
        } else {
          console.log('✅ Push token synced to database successfully');
          console.log('📊 Updated user data:', data);
        }
      } else {
        console.log('⚠️ No user session found, token will be synced when user logs in');
        console.log('📱 Storing token for later sync:', token);
        // Store token for later sync
        await AsyncStorage.setItem('pendingTokenSync', token);
      }
    } catch (error) {
      console.error('❌ Error in syncTokenToDatabase:', error);
      console.error('❌ Error stack:', (error as Error).stack);
    }
  }

  // Enhanced push notification registration with comprehensive error handling
  async function registerForPushNotificationsAsync(): Promise<string | null> {
    let token;

    if (Platform.OS === 'android') {
      // Create notification channels for different types of notifications
      console.log('📱 Setting up Android notification channels...');
      
      try {
        await Promise.all([
          Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#f23b36',
            sound: 'notification_sound.wav',
            description: 'Default notifications from Stride Campus',
          }),
          Notifications.setNotificationChannelAsync('messages', {
            name: 'Messages',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#f23b36',
            sound: 'notification_sound.wav',
            description: 'Direct messages and chat notifications',
          }),
          Notifications.setNotificationChannelAsync('social', {
            name: 'Social',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250],
            lightColor: '#f23b36',
            description: 'Likes, comments, and social interactions',
          }),
          Notifications.setNotificationChannelAsync('events', {
            name: 'Events',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250, 250, 250],
            lightColor: '#f23b36',
            description: 'Campus events and announcements',
          }),
          Notifications.setNotificationChannelAsync('academic', {
            name: 'Academic',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 500],
            lightColor: '#f23b36',
            description: 'Study reminders and academic notifications',
          }),
        ]);
        console.log('✅ Android notification channels created successfully');
      } catch (error) {
        console.error('❌ Error creating Android notification channels:', error);
      }
    }

    if (Device.isDevice) {
      try {
        console.log('📱 Checking notification permissions...');
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        setNotificationPermission(existingStatus);
        onPermissionChange(existingStatus);
        
        if (existingStatus !== 'granted') {
          console.log('📱 Requesting notification permissions...');
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          setNotificationPermission(status);
          onPermissionChange(status);
        }
        
        if (finalStatus !== 'granted') {
          console.warn('⚠️ Notification permission denied');
          Alert.alert(
            'Permission Required',
            'Push notifications are disabled. You can enable them in your device settings.',
            [{ text: 'OK' }]
          );
          return null;
        }
        
        console.log('✅ Notification permission granted');
        
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
          if (!projectId) {
            throw new Error('Project ID not found in Expo configuration');
          }
          
          console.log('📱 Getting Expo push token with project ID:', projectId);
          token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
          console.log('✅ Expo Push Token obtained:', token);
          
          // Validate token format
          if (!token || (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken['))) {
            throw new Error('Invalid push token format received');
          }
          
        } catch (e) {
          console.error('❌ Error getting push token:', e);
          token = null;
        }
      } catch (error) {
        console.error('❌ Error in notification setup:', error);
        token = null;
      }
    } else {
      console.log('⚠️ Must use physical device for Push Notifications');
    }

    return token ?? null;
  }

  // Check for pending token sync when user logs in
  const checkPendingTokenSync = async () => {
    try {
      const pendingToken = await AsyncStorage.getItem('pendingTokenSync');
      if (pendingToken) {
        console.log('🔄 Found pending token sync, attempting to sync...');
        await syncTokenToDatabase(pendingToken);
        await AsyncStorage.removeItem('pendingTokenSync');
      }
    } catch (error) {
      console.error('❌ Error checking pending token sync:', error);
    }
  };

  // Expose methods for external use
  const getToken = () => expoPushToken;
  const getPermission = () => notificationPermission;
  const getIsRegistered = () => isTokenRegistered;

  return {
    getToken,
    getPermission,
    getIsRegistered,
    checkPendingTokenSync,
    registerForPushNotificationsAsync,
    syncTokenToDatabase
  };
}
