'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { useExpoPushNotifications } from '@/hooks/useExpoPushNotifications';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Settings, Bell, Shield, Trash2, Camera, ExternalLink, Heart, Instagram, Twitter, Phone, Smartphone, CheckCircle } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/hooks/use-toast';
import DonationSection from '@/components/common/DonationSection';

export default function SettingsPage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const { handleNavigateToAuth, isAuthenticated } = useApp();
  const router = useRouter();
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    expoPushToken,
    isLoading: pushLoading,
    requestPermission: requestPushPermission,
    updatePushToken,
    sendTestNotification
  } = useExpoPushNotifications();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    school_name: '',
  });

  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    profile_visibility: 'public',
  });

  // Initialize form data
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        username: user.username || '',
        bio: user.bio || '',
        school_name: user.school_name || '',
      });
      
      // Load account settings from user preferences or defaults
      setAccountSettings({
        email_notifications: user.email_notifications ?? true,
        push_notifications: user.push_notifications ?? true,
        marketing_emails: user.marketing_emails ?? false,
        profile_visibility: user.profile_visibility || 'public',
      });
    }
  }, [user]);

  // Update push token when available and user wants push notifications
  useEffect(() => {
    if (user && expoPushToken && accountSettings.push_notifications) {
      updatePushToken(user.id).catch(console.error);
    }
  }, [user, expoPushToken, accountSettings.push_notifications, updatePushToken]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      handleNavigateToAuth();
    }
  }, [authLoading, isAuthenticated, handleNavigateToAuth]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await updateUser(profileForm);
      if (error) throw error;
      
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

  const handleAccountSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await updateUser(accountSettings);
      if (error) throw error;
      
      toast({
        title: "Settings updated",
        description: "Your account settings have been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled && pushSupported && pushPermission !== 'granted') {
      const granted = await requestPushPermission();
      if (!granted) {
        toast({
          title: "Permission Required",
          description: "Please enable notifications to receive push notifications.",
          variant: "destructive",
        });
        return;
      }
    }

    setAccountSettings(prev => ({ ...prev, push_notifications: enabled }));

    // Update the database
    if (user) {
      try {
        const updateData = {
          push_notifications: enabled,
          expo_push_token: enabled ? expoPushToken : null,
        };
        
        const { error } = await updateUser(updateData);
        if (error) throw error;

        toast({
          title: enabled ? "Push notifications enabled" : "Push notifications disabled",
          description: enabled 
            ? "You'll now receive push notifications on your mobile device."
            : "You won't receive push notifications anymore.",
        });
      } catch (error) {
        console.error('Error updating push notification settings:', error);
        toast({
          title: "Error",
          description: "Failed to update notification settings.",
          variant: "destructive",
        });
        // Revert the toggle
        setAccountSettings(prev => ({ ...prev, push_notifications: !enabled }));
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmed) {
      try {
        setLoading(true);
        // Delete user data and account
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
        
        if (error) throw error;
        
        // Sign out and redirect
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'support', label: 'Support Us', icon: Heart },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 md:ml-20 mb-16">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#f23b36] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your public profile information that other users can see.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profileForm.username}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Your username"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="school_name">School/University</Label>
                        <Input
                          id="school_name"
                          value={profileForm.school_name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, school_name: e.target.value }))}
                          placeholder="Your school or university"
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={loading} className="bg-[#f23b36] hover:bg-[#e03530]">
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === 'account' && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account preferences and visibility settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={accountSettings.email_notifications}
                      onCheckedChange={(checked) => 
                        setAccountSettings(prev => ({ ...prev, email_notifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">Push Notifications</h3>
                        <Smartphone size={16} className="text-gray-500" />
                        {pushSupported && pushPermission === 'granted' && expoPushToken && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {pushSupported 
                          ? "Receive push notifications on your mobile device" 
                          : "Only available in the mobile app"}
                      </p>
                      {pushSupported && pushPermission === 'denied' && (
                        <p className="text-sm text-orange-600 mt-1">
                          Notifications are blocked. Please enable them in your device settings.
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={accountSettings.push_notifications && pushSupported}
                      onCheckedChange={handlePushNotificationToggle}
                      disabled={!pushSupported || pushLoading}
                    />
                  </div>

                  {/* Push notification status and test */}
                  {pushSupported && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">Push Notification Status</h4>
                        <Badge variant={pushPermission === 'granted' ? 'default' : 'secondary'}>
                          {pushPermission === 'granted' ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      {pushPermission === 'granted' && expoPushToken && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            ✅ Connected to Expo Push Service
                          </p>
                          <Button
                            onClick={sendTestNotification}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Send Test Notification
                          </Button>
                        </div>
                      )}
                      
                      {pushPermission !== 'granted' && (
                        <p className="text-sm text-gray-600">
                          Enable push notifications to receive real-time updates
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Marketing Emails</h3>
                      <p className="text-sm text-gray-600">Receive updates about new features and events</p>
                    </div>
                    <Switch
                      checked={accountSettings.marketing_emails}
                      onCheckedChange={(checked) => 
                        setAccountSettings(prev => ({ ...prev, marketing_emails: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Profile Visibility</h3>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="visibility"
                          value="public"
                          checked={accountSettings.profile_visibility === 'public'}
                          onChange={(e) => 
                            setAccountSettings(prev => ({ ...prev, profile_visibility: e.target.value }))
                          }
                          className="text-[#f23b36]"
                        />
                        <span>Public - Anyone can see your profile</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="visibility"
                          value="campus"
                          checked={accountSettings.profile_visibility === 'campus'}
                          onChange={(e) => 
                            setAccountSettings(prev => ({ ...prev, profile_visibility: e.target.value }))
                          }
                          className="text-[#f23b36]"
                        />
                        <span>Campus Only - Only students from your campus</span>
                      </label>
                    </div>
                  </div>

                  <Button 
                    onClick={handleAccountSettingsSubmit} 
                    disabled={loading}
                    className="bg-[#f23b36] hover:bg-[#e03530]"
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {/* Mobile App Alert */}
                {!pushSupported && (
                  <Alert>
                    <Smartphone className="h-4 w-4" />
                    <AlertDescription>
                      For the best notification experience, download our mobile app to receive push notifications.
                    </AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose what notifications you want to receive.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">New Messages</h3>
                          <p className="text-sm text-gray-600">Get notified when someone sends you a message</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Post Interactions</h3>
                          <p className="text-sm text-gray-600">Notifications for likes, comments, and shares</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">New Followers</h3>
                          <p className="text-sm text-gray-600">Get notified when someone follows you</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Space Updates</h3>
                          <p className="text-sm text-gray-600">Updates from spaces you've joined</p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Study Reminders</h3>
                          <p className="text-sm text-gray-600">Reminders for upcoming exams and assignments</p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Campus Events</h3>
                          <p className="text-sm text-gray-600">Notifications about events at your campus</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Notification Timing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quiet_hours_start">Quiet Hours Start</Label>
                          <Input
                            id="quiet_hours_start"
                            type="time"
                            defaultValue="22:00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="quiet_hours_end">Quiet Hours End</Label>
                          <Input
                            id="quiet_hours_end"
                            type="time"
                            defaultValue="07:00"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        You won't receive push notifications during quiet hours
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'support' && (
              <DonationSection variant="full" />
            )}

            {activeTab === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Security</CardTitle>
                  <CardDescription>
                    Manage your privacy settings and account security.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Account Status</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ✓ Verified Account
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {user.school_domain ? `${user.school_domain} Domain` : 'Student Account'}
                        </Badge>
                        {pushSupported && pushPermission === 'granted' && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            📱 Push Enabled
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2">Data & Privacy</h3>
                      <div className="space-y-3 text-sm text-gray-600">
                        <p>• Your data is stored securely and never shared with third parties without consent</p>
                        <p>• You can download your data or request account deletion at any time</p>
                        <p>• We use minimal tracking and respect your privacy choices</p>
                        <p>• Push notification tokens are stored securely and only used for sending notifications</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-4 text-red-600">Danger Zone</h3>
                      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
                        <p className="text-sm text-red-700 mb-4">
                          Once you delete your account, there is no going back. This will permanently delete your profile, posts, and all associated data.
                        </p>
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteAccount}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 size={16} className="mr-2" />
                          {loading ? 'Deleting...' : 'Delete Account'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}