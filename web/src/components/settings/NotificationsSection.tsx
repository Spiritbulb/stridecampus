'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CustomSwitch } from './CustomSwitch';
import { Smartphone } from 'lucide-react';

interface NotificationsSectionProps {
  pushSupported: boolean;
}

export function NotificationsSection({ pushSupported }: NotificationsSectionProps) {
  return (
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
              <CustomSwitch checked={true} onCheckedChange={() => {}} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Post Interactions</h3>
                <p className="text-sm text-gray-600">Notifications for likes, comments, and shares</p>
              </div>
              <CustomSwitch checked={true} onCheckedChange={() => {}} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">New Followers</h3>
                <p className="text-sm text-gray-600">Get notified when someone follows you</p>
              </div>
              <CustomSwitch checked={true} onCheckedChange={() => {}} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Space Updates</h3>
                <p className="text-sm text-gray-600">Updates from spaces you've joined</p>
              </div>
              <CustomSwitch checked={false} onCheckedChange={() => {}} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Study Reminders</h3>
                <p className="text-sm text-gray-600">Reminders for upcoming exams and assignments</p>
              </div>
              <CustomSwitch checked={false} onCheckedChange={() => {}} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Campus Events</h3>
                <p className="text-sm text-gray-600">Notifications about events at your campus</p>
              </div>
              <CustomSwitch checked={true} onCheckedChange={() => {}} />
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
  );
}

