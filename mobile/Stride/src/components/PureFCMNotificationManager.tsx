import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabaseClient';

interface PureFCMNotificationManagerProps {
  webViewRef: React.RefObject<any>;
  onTokenChange: (token: string, isRegistered: boolean) => void;
  onPermissionChange: (permission: string) => void;
  userId: string | null;
}

// Export methods interface for ref
export interface PureFCMNotificationManagerRef {
  registerForPureFCMNotificationsAsync: () => Promise<string | null>;
  syncPureFCMTokenToDatabase: (token: string) => Promise<void>;
}

const PureFCMNotificationManager = forwardRef<PureFCMNotificationManagerRef, PureFCMNotificationManagerProps>(
  ({ webViewRef, onTokenChange, onPermissionChange, userId }, ref) => {
    const [fcmToken, setFcmToken] = useState<string>('');

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      registerForPureFCMNotificationsAsync,
      syncPureFCMTokenToDatabase
    }));

    // Pure FCM notification handler
    useEffect(() => {
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          console.log('🔔 Pure FCM Notification received:', notification);
          
          const { title, body, data } = notification.request.content;
          console.log('📱 Pure FCM Notification details:', { title, body, data });
          
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

    // Initialize pure FCM notifications
    useEffect(() => {
      const initializePureFCMNotifications = async () => {
        try {
          console.log('🚀 Initializing Pure FCM notifications...');
          
          // Check if we have a stored FCM token first
          const storedToken = await AsyncStorage.getItem('pureFCMToken');
          if (storedToken) {
            console.log('📱 Found stored Pure FCM token:', storedToken);
            setFcmToken(storedToken);
            onTokenChange(storedToken, true);
            
            // Validate stored token
            const isValid = await validateStoredPureFCMToken(storedToken);
            if (isValid) {
              console.log('✅ Stored Pure FCM token is valid');
              return;
            } else {
              console.log('⚠️ Stored Pure FCM token is invalid, generating new one');
            }
          }
          
          // Register for pure FCM notifications
          const token = await registerForPureFCMNotificationsAsync();
          if (token) {
            setFcmToken(token);
            onTokenChange(token, true);
            console.log('✅ Pure FCM token registered successfully');
            
            // Store token locally
            await AsyncStorage.setItem('pureFCMToken', token);
            await AsyncStorage.setItem('pureFCMTokenTimestamp', new Date().toISOString());
            
            // Auto sync if user is logged in
            await syncPureFCMTokenToDatabase(token);
          } else {
            console.warn('⚠️ Failed to get Pure FCM token');
          }
        } catch (error) {
          console.error('❌ Error initializing Pure FCM notifications:', error);
        }
      };

      initializePureFCMNotifications();

      // Notification listeners
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('🔔 Pure FCM Notification received (foreground):', notification);
        
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'PURE_FCM_NOTIFICATION_RECEIVED',
            notification: {
              title: notification.request.content.title,
              body: notification.request.content.body,
              data: notification.request.content.data,
              timestamp: new Date().toISOString(),
            }
          }));
        }
      });

      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('🔔 Pure FCM Notification tapped:', response);
        
        const notificationData = response.notification.request.content.data;
        
        if (notificationData?.type && webViewRef.current) {
          let url = '';
          switch (notificationData.type) {
            case 'message':
              url = '/chats';
              break;
            case 'follow':
              url = notificationData.senderId ? `/u/${notificationData.senderId}` : '';
              break;
            case 'event':
              url = '/arena';
              break;
            default:
              url = notificationData.url as string || '';
          }
          
          if (url) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'NAVIGATE_TO_URL',
              url: url
            }));
          }
        }
      });

      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    }, []);

    // Set up realtime database listener
    useEffect(() => {
      if (!userId) return;

      console.log('🔔 Setting up realtime Pure FCM notification listener for user:', userId);
      
      const subscription = supabase
        .channel('mobile-pure-fcm-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          async (payload) => {
            console.log('🔔 New Pure FCM notification from database:', payload);
            
            const notification = payload.new as any;
            
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
                trigger: null,
              });
              
              console.log('✅ Local Pure FCM notification sent');
            } catch (error) {
              console.error('❌ Error sending local Pure FCM notification:', error);
            }
            
            if (webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({
                type: 'PURE_FCM_DATABASE_NOTIFICATION_RECEIVED',
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
          console.log('🔔 Realtime Pure FCM notification subscription status:', status);
        });

      return () => {
        subscription.unsubscribe();
      };
    }, [userId, webViewRef]);

    // Periodic token refresh
    useEffect(() => {
      const refreshInterval = setInterval(async () => {
        try {
          const storedToken = await AsyncStorage.getItem('pureFCMToken');
          if (storedToken) {
            const isValid = await validateStoredPureFCMToken(storedToken);
            if (!isValid) {
              console.log('🔄 Refreshing expired Pure FCM token...');
              const newToken = await registerForPureFCMNotificationsAsync();
              if (newToken) {
                setFcmToken(newToken);
                onTokenChange(newToken, true);
                await AsyncStorage.setItem('pureFCMToken', newToken);
                await AsyncStorage.setItem('pureFCMTokenTimestamp', new Date().toISOString());
                await syncPureFCMTokenToDatabase(newToken);
                
                if (webViewRef.current) {
                  webViewRef.current.postMessage(JSON.stringify({
                    type: 'PURE_FCM_TOKEN_REFRESHED',
                    token: newToken,
                    timestamp: new Date().toISOString()
                  }));
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Error in periodic Pure FCM token refresh:', error);
        }
      }, 30 * 60 * 1000);

      return () => clearInterval(refreshInterval);
    }, []);

    async function validateStoredPureFCMToken(token: string): Promise<boolean> {
      try {
        if (!token || token.length < 10) return false;
        
        const tokenTimestamp = await AsyncStorage.getItem('pureFCMTokenTimestamp');
        if (tokenTimestamp) {
          const tokenAge = Date.now() - new Date(tokenTimestamp).getTime();
          const maxAge = 24 * 60 * 60 * 1000;
          if (tokenAge > maxAge) {
            console.log('🕒 Pure FCM Token is too old');
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error('Error validating stored Pure FCM token:', error);
        return false;
      }
    }

    async function syncPureFCMTokenToDatabase(token: string): Promise<void> {
      try {
        console.log('🔄 Syncing Pure FCM token to database...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
          return;
        }
        
        if (session?.user) {
          console.log('🔄 Syncing for user:', session.user.id);
          
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
            console.error('❌ Error syncing Pure FCM token:', error);
          } else {
            console.log('✅ Pure FCM token synced successfully');
          }
        } else {
          console.log('⚠️ No user session, storing for later sync');
          await AsyncStorage.setItem('pendingPureFCMTokenSync', token);
        }
      } catch (error) {
        console.error('❌ Error in syncPureFCMTokenToDatabase:', error);
      }
    }

    async function registerForPureFCMNotificationsAsync(): Promise<string | null> {
      let token = null;

      if (Platform.OS === 'android') {
        console.log('📱 Setting up Android Pure FCM notification channels...');
        
        try {
          await Promise.all([
            Notifications.setNotificationChannelAsync('default', {
              name: 'Default',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#f23b36',
              sound: 'notification_sound.wav',
              description: 'Default notifications',
            }),
            Notifications.setNotificationChannelAsync('messages', {
              name: 'Messages',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#f23b36',
              sound: 'notification_sound.wav',
              description: 'Direct messages',
            }),
            Notifications.setNotificationChannelAsync('social', {
              name: 'Social',
              importance: Notifications.AndroidImportance.DEFAULT,
              vibrationPattern: [0, 250],
              lightColor: '#f23b36',
              description: 'Social interactions',
            }),
            Notifications.setNotificationChannelAsync('events', {
              name: 'Events',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 250, 250, 250, 250, 250],
              lightColor: '#f23b36',
              description: 'Campus events',
            }),
            Notifications.setNotificationChannelAsync('academic', {
              name: 'Academic',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 500],
              lightColor: '#f23b36',
              description: 'Academic notifications',
            }),
          ]);
          console.log('✅ Android Pure FCM notification channels created');
        } catch (error) {
          console.error('❌ Error creating channels:', error);
        }
      }

      if (Device.isDevice) {
        try {
          console.log('📱 Checking Pure FCM notification permissions...');
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          
          onPermissionChange(existingStatus);
          
          if (existingStatus !== 'granted') {
            console.log('📱 Requesting Pure FCM notification permissions...');
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            onPermissionChange(status);
          }
          
          if (finalStatus !== 'granted') {
            console.warn('⚠️ Pure FCM Notification permission denied');
            Alert.alert(
              'Permission Required',
              'Push notifications are disabled. Enable them in device settings.',
              [{ text: 'OK' }]
            );
            return null;
          }
          
          console.log('✅ Pure FCM Notification permission granted');
          
          try {
            console.log('📱 Getting Pure FCM device push token...');
            token = (await Notifications.getDevicePushTokenAsync()).data;
            console.log('✅ Pure FCM Device Push Token obtained');
            
            if (!token || token.length < 10) {
              throw new Error('Invalid Pure FCM token format');
            }
          } catch (e) {
            console.error('❌ Error getting Pure FCM token:', e);
            token = null;
          }
        } catch (error) {
          console.error('❌ Error in Pure FCM notification setup:', error);
          token = null;
        }
      } else {
        console.log('⚠️ Must use physical device for Pure FCM Push Notifications');
      }

      return token;
    }

    // Component doesn't render anything
    return null;
  }
);

PureFCMNotificationManager.displayName = 'PureFCMNotificationManager';

export default PureFCMNotificationManager;