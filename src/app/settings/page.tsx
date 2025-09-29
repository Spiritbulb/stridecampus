'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { useUnifiedNotifications } from '@/hooks/useUnifiedNotifications';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/hooks/use-toast';
import DonationSection from '@/components/common/DonationSection';
import { 
  SettingsSidebar, 
  ProfileSection, 
  AccountSection, 
  NotificationsSection, 
  PrivacySection,
  ThemeSection
} from '@/components/settings';

export default function SettingsPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { handleNavigateToAuth, isAuthenticated } = useApp();
  const router = useRouter();
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    expoPushToken,
    isLoading: pushLoading,
    type: notificationType,
    requestPermission: requestPushPermission,
    updatePushToken,
    sendTestNotification
  } = useUnifiedNotifications();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    school_name: '',
  });

  // Account settings state with optimistic updates
  const [accountSettings, setAccountSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    profile_visibility: 'public',
  });

  // Track what's actually in the database vs optimistic state
  const [dbState, setDbState] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    profile_visibility: 'public',
  });

  const [updatingSettings, setUpdatingSettings] = useState<Set<string>>(new Set());

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      const profile = {
        full_name: user.full_name || '',
        username: user.username || '',
        bio: user.bio || '',
        school_name: user.school_name || '',
      };
      setProfileForm(profile);
      
      const settings = {
        email_notifications: user.email_notifications ?? true,
        push_notifications: user.push_notifications ?? true,
        marketing_emails: user.marketing_emails ?? false,
        profile_visibility: user.profile_visibility || 'public',
      };
      setAccountSettings(settings);
      setDbState(settings);
    }
  }, [user]);

  // Update push token when available and user wants push notifications
  useEffect(() => {
    if (user && expoPushToken && accountSettings.push_notifications && pushPermission === 'granted') {
      updatePushToken(user.id).catch(error => {
        console.error('Failed to update push token:', error);
        toast({
          title: "Error",
          description: "Failed to update push notification token. Please try again.",
          variant: "destructive",
        });
      });
    }
  }, [user, expoPushToken, accountSettings.push_notifications, pushPermission, updatePushToken]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      handleNavigateToAuth();
    }
  }, [authLoading, isAuthenticated, handleNavigateToAuth]);

  // Generic function to update any setting with optimistic updates
  const updateSetting = useCallback(async (key: string, value: any, additionalData?: Record<string, any>) => {
    if (!user) return false;

    // Optimistic update
    setAccountSettings(prev => ({ ...prev, [key]: value }));
    setUpdatingSettings(prev => new Set(prev).add(key));

    try {
      const updateData = { [key]: value, ...additionalData };
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Update database state tracking
      setDbState(prev => ({ ...prev, [key]: value }));
      
      // Refresh user data to ensure consistency
      await refreshUser();
      
      return true;
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      
      // Revert optimistic update
      setAccountSettings(prev => ({ ...prev, [key]: dbState[key as keyof typeof dbState] }));
      
      toast({
        title: "Error",
        description: `Failed to update ${key.replace('_', ' ')}. Please try again.`,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setUpdatingSettings(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  }, [user, dbState, refreshUser]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileForm.full_name,
          username: profileForm.username,
          bio: profileForm.bio,
          school_name: profileForm.school_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await refreshUser();
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailNotificationsToggle = async (enabled: boolean) => {
    await updateSetting('email_notifications', enabled);
    
    if (enabled) {
      toast({
        title: "Email notifications enabled",
        description: "You'll receive notifications via email.",
      });
    } else {
      toast({
        title: "Email notifications disabled", 
        description: "You won't receive email notifications anymore.",
      });
    }
  };

  const handleMarketingEmailsToggle = async (enabled: boolean) => {
    await updateSetting('marketing_emails', enabled);
    
    if (enabled) {
      toast({
        title: "Marketing emails enabled",
        description: "You'll receive updates about new features and events.",
      });
    } else {
      toast({
        title: "Marketing emails disabled",
        description: "You won't receive marketing emails anymore.",
      });
    }
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      // Check if we have permission
      if (pushSupported && pushPermission !== 'granted') {
        const granted = await requestPushPermission();
        if (!granted) {
          toast({
            title: "Permission Required",
            description: `Please enable notifications in your ${notificationType === 'expo' ? 'device' : 'browser'} settings to receive push notifications.`,
            variant: "destructive",
          });
          return;
        }
      }

      if (!pushSupported) {
        toast({
          title: "Not Supported",
          description: "Push notifications are not supported on this device/browser.",
          variant: "destructive",
        });
        return;
      }
    }

    const success = await updateSetting('push_notifications', enabled, {
      expo_push_token: enabled && expoPushToken ? expoPushToken : null
    });

    if (success) {
      if (enabled) {
        const deviceType = notificationType === 'expo' ? 'mobile device' : 'browser';
        toast({
          title: "Push notifications enabled",
          description: `You'll now receive push notifications on your ${deviceType}.`,
        });
      } else {
        toast({
          title: "Push notifications disabled",
          description: "You won't receive push notifications anymore.",
        });
      }
    }
  };

  const handleVisibilityChange = async (visibility: string) => {
    await updateSetting('profile_visibility', visibility);
    
    toast({
      title: "Profile visibility updated",
      description: `Your profile is now ${visibility === 'public' ? 'visible to everyone' : 'visible to campus only'}.`,
    });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmed) {
      try {
        setLoading(true);
        
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
        
        if (error) throw error;
        
        // Sign out and redirect
        await supabase.auth.signOut();
        router.push('/');
      } catch (error) {
        console.error('Error deleting account:', error);
        toast({
          title: "Error",
          description: "Failed to delete account. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background md:ml-20 mb-16">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <ProfileSection
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                onSubmit={handleProfileSubmit}
                loading={loading}
              />
            )}

            {activeTab === 'account' && (
              <AccountSection
                accountSettings={accountSettings}
                updatingSettings={updatingSettings}
                pushSupported={pushSupported}
                pushPermission={pushPermission}
                notificationType={notificationType}
                expoPushToken={expoPushToken}
                pushLoading={pushLoading}
                onEmailNotificationsToggle={handleEmailNotificationsToggle}
                onMarketingEmailsToggle={handleMarketingEmailsToggle}
                onPushNotificationToggle={handlePushNotificationToggle}
                onVisibilityChange={handleVisibilityChange}
                onSendTestNotification={sendTestNotification}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsSection pushSupported={pushSupported} />
            )}

            {activeTab === 'theme' && (
              <ThemeSection />
            )}

            {activeTab === 'support' && (
              <DonationSection variant="full" />
            )}

            {activeTab === 'privacy' && (
              <PrivacySection
                user={user}
                accountSettings={accountSettings}
                pushSupported={pushSupported}
                pushPermission={pushPermission}
                expoPushToken={expoPushToken}
                loading={loading}
                onDeleteAccount={handleDeleteAccount}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}