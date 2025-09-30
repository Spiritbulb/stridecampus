'use client';
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, Shield, Cookie, Copyright, ExternalLink } from 'lucide-react';

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
  fcmToken?: string | null; // Add FCM token support
  loading: boolean;
  onDeleteAccount: () => void;
}

export function PrivacySection({
  user,
  accountSettings,
  pushSupported,
  pushPermission,
  expoPushToken,
  fcmToken, // Add FCM token parameter
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
            <h3 className="font-medium mb-3">Legal Documents</h3>
            <p className="text-sm text-gray-600 mb-4">
              Review our legal policies and terms that govern your use of Stride Campus.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link 
                href="/legal/terms" 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Terms of Service</span>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
              </Link>
              
              <Link 
                href="/legal/privacy" 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Privacy Policy</span>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
              </Link>
              
              <Link 
                href="/legal/cookies" 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Cookie className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Cookie Policy</span>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
              </Link>
              
              <Link 
                href="/legal/dmca" 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Copyright className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-900">Copyright Policy</span>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
              </Link>
            </div>
            
            <div className="mt-3">
              <Link 
                href="/legal" 
                className="text-sm text-[#f23b36] hover:text-[#f23b36]/80 font-medium"
              >
                View all legal documents →
              </Link>
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

