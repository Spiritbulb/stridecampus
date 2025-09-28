'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

interface User {
  id: string;
  school_domain?: string;
}

interface AccountSettings {
  email_notifications: boolean;
  push_notifications: boolean;
}

interface PrivacySectionProps {
  user: User;
  accountSettings: AccountSettings;
  pushSupported: boolean;
  pushPermission: string;
  expoPushToken: string | null;
  loading: boolean;
  onDeleteAccount: () => void;
}

export function PrivacySection({
  user,
  accountSettings,
  pushSupported,
  pushPermission,
  expoPushToken,
  loading,
  onDeleteAccount
}: PrivacySectionProps) {
  return (
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
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                ✓ Verified Account
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {user.school_domain ? `${user.school_domain} Domain` : 'Student Account'}
              </Badge>
              {pushSupported && pushPermission === 'granted' && expoPushToken && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  📱 Push Enabled
                </Badge>
              )}
              {accountSettings.email_notifications && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  📧 Email Enabled
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
              <p>• Email preferences are honored and you can unsubscribe at any time</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-4 text-red-600">Danger Zone</h3>
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
              <p className="text-sm text-red-700 mb-4">
                Once you delete your account, there is no going back. This will permanently delete your profile, posts, and all associated data including notification preferences.
              </p>
              <Button 
                variant="destructive" 
                onClick={onDeleteAccount}
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
  );
}

