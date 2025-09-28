'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { CustomSwitch } from './CustomSwitch';
import { Smartphone, CheckCircle, AlertTriangle } from 'lucide-react';

interface AccountSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  profile_visibility: string;
}

interface AccountSectionProps {
  accountSettings: AccountSettings;
  updatingSettings: Set<string>;
  pushSupported: boolean;
  pushPermission: string;
  notificationType: string;
  expoPushToken: string | null;
  pushLoading: boolean;
  onEmailNotificationsToggle: (enabled: boolean) => void;
  onMarketingEmailsToggle: (enabled: boolean) => void;
  onPushNotificationToggle: (enabled: boolean) => void;
  onVisibilityChange: (visibility: string) => void;
  onSendTestNotification: () => void;
}

export function AccountSection({
  accountSettings,
  updatingSettings,
  pushSupported,
  pushPermission,
  notificationType,
  expoPushToken,
  pushLoading,
  onEmailNotificationsToggle,
  onMarketingEmailsToggle,
  onPushNotificationToggle,
  onVisibilityChange,
  onSendTestNotification
}: AccountSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Manage your account preferences and visibility settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Email Notifications</h3>
            <p className="text-sm text-gray-600">Receive notifications via email</p>
          </div>
          <div className="flex items-center gap-2">
            {updatingSettings.has('email_notifications') && (
              <LoadingSpinner size="small" />
            )}
            <CustomSwitch
              checked={accountSettings.email_notifications}
              onCheckedChange={onEmailNotificationsToggle}
              disabled={updatingSettings.has('email_notifications')}
            />
          </div>
        </div>

        {/* Push Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Push Notifications</h3>
                <Smartphone size={16} className="text-gray-500" />
                {pushSupported && pushPermission === 'granted' && (notificationType === 'expo' ? expoPushToken : true) && (
                  <CheckCircle size={16} className="text-green-500" />
                )}
                {pushSupported && pushPermission === 'denied' && (
                  <AlertTriangle size={16} className="text-orange-500" />
                )}
                {pushSupported && (
                  <Badge variant="secondary" className="text-xs">
                    {notificationType === 'expo' ? 'Mobile App' : 'Web Browser'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {pushSupported 
                  ? `Receive push notifications ${notificationType === 'expo' ? 'on your mobile device' : 'in your browser'}`
                  : "Not supported on this device/browser"}
              </p>
              {pushSupported && pushPermission === 'denied' && (
                <p className="text-sm text-orange-600 mt-1">
                  Notifications are blocked. Enable them in your {notificationType === 'expo' ? 'device' : 'browser'} settings.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {updatingSettings.has('push_notifications') && (
                <LoadingSpinner size="small" />
              )}
              <CustomSwitch
                checked={accountSettings.push_notifications && pushSupported}
                onCheckedChange={onPushNotificationToggle}
                disabled={!pushSupported || updatingSettings.has('push_notifications')}
              />
            </div>
          </div>
          
          {/* Test Notification Button */}
          {pushSupported && accountSettings.push_notifications && pushPermission === 'granted' && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onSendTestNotification}
                disabled={pushLoading}
                className="text-xs"
              >
                {pushLoading ? 'Sending...' : 'Send Test Notification'}
              </Button>
            </div>
          )}
        </div>

        {/* Push notification status */}
        {pushSupported && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Push Notification Status</h4>
              <Badge variant={pushPermission === 'granted' && expoPushToken ? 'default' : 'secondary'}>
                {pushPermission === 'granted' && expoPushToken ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
            
            {pushPermission === 'granted' && expoPushToken ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  ✅ Connected to Expo Push Service
                </p>
                <Button
                  onClick={onSendTestNotification}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled={pushLoading}
                >
                  {pushLoading ? 'Sending...' : 'Send Test Notification'}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {pushPermission === 'denied' 
                  ? 'Enable notifications in your device settings'
                  : 'Enable push notifications to receive real-time updates'}
              </p>
            )}
          </div>
        )}

        {/* Marketing Emails */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Marketing Emails</h3>
            <p className="text-sm text-gray-600">Receive updates about new features and events</p>
          </div>
          <div className="flex items-center gap-2">
            {updatingSettings.has('marketing_emails') && (
              <LoadingSpinner size="small" />
            )}
            <CustomSwitch
              checked={accountSettings.marketing_emails}
              onCheckedChange={onMarketingEmailsToggle}
              disabled={updatingSettings.has('marketing_emails')}
            />
          </div>
        </div>

        <Separator />

        {/* Profile Visibility */}
        <div>
          <h3 className="font-medium mb-2">Profile Visibility</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={accountSettings.profile_visibility === 'public'}
                onChange={(e) => onVisibilityChange(e.target.value)}
                className="text-[#f23b36]"
                disabled={updatingSettings.has('profile_visibility')}
              />
              <span>Public - Anyone can see your profile</span>
              {updatingSettings.has('profile_visibility') && accountSettings.profile_visibility === 'public' && (
                <LoadingSpinner size="small" />
              )}
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="visibility"
                value="campus"
                checked={accountSettings.profile_visibility === 'campus'}
                onChange={(e) => onVisibilityChange(e.target.value)}
                className="text-[#f23b36]"
                disabled={updatingSettings.has('profile_visibility')}
              />
              <span>Campus Only - Only students from your campus</span>
              {updatingSettings.has('profile_visibility') && accountSettings.profile_visibility === 'campus' && (
                <LoadingSpinner size="small" />
              )}
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

