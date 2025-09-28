'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedNotifications } from '@/hooks/useUnifiedNotifications';
import { supabase } from '@/utils/supabaseClient';
import { 
  Send, 
  Users, 
  User, 
  School, 
  Bell, 
  MessageSquare, 
  Heart, 
  Calendar,
  BookOpen,
  Target,
  Activity,
  Lock,
  Shield
} from 'lucide-react';

interface AnnouncementForm {
  type: 'test' | 'message' | 'follower' | 'campus_event' | 'study_reminder' | 'custom';
  title: string;
  body: string;
  targetType: 'user' | 'users' | 'campus' | 'all';
  targetValue: string;
  customData: string;
}

export default function AdminAnnouncementsPage() {
  const { user, isAuthenticated } = useApp();
  const { toast } = useToast();
  const { sendTestNotification: unifiedSendTest } = useUnifiedNotifications();
  
  const [form, setForm] = useState<AnnouncementForm>({
    type: 'test',
    title: '',
    body: '',
    targetType: 'user',
    targetValue: '',
    customData: '{}'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersWithTokens: 0,
    campuses: 0
  });

  // Check if user has admin access (basic protection)
  const isAuthorized = isAuthenticated && user && (
    user.email?.endsWith('@stridecampus.com') || 
    user.role === 'admin' ||
    // Temporary bypass for testing - REMOVE IN PRODUCTION
    user.id === 'your-user-id-here' // Replace with your actual user ID
  );

  // Debug logging
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔍 Admin Debug Info:', {
        isAuthenticated,
        userEmail: user.email,
        userRole: user.role,
        userId: user.id,
        emailEndsWithStrideCampus: user.email?.endsWith('@stridecampus.com'),
        roleIsAdmin: user.role === 'admin',
        isAuthorized
      });
      
      // Check browser notification permissions
      if ('Notification' in window) {
        console.log('🔔 Browser Notification Permission:', Notification.permission);
        console.log('🔔 Service Worker Support:', 'serviceWorker' in navigator);
        console.log('🔔 Push Manager Support:', 'PushManager' in window);
      }
    }
  }, [isAuthenticated, user, isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      fetchStats();
    }
  }, [isAuthorized]);

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get users with push tokens
      const { count: usersWithTokens } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .not('expo_push_token', 'is', null)
        .eq('push_notifications', true);

      // Get unique campuses
      const { data: campusData } = await supabase
        .from('users')
        .select('school_domain')
        .not('school_domain', 'is', null);

      const uniqueCampuses = new Set(campusData?.map(u => u.school_domain)).size;

      setStats({
        totalUsers: totalUsers || 0,
        usersWithTokens: usersWithTokens || 0,
        campuses: uniqueCampuses
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!isAuthorized) {
      toast({
        title: "Unauthorized",
        description: "You don't have permission to send notifications.",
        variant: "destructive"
      });
      return;
    }

    if (!form.title.trim() || !form.body.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and body are required.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let payload: any = {
        type: form.type,
      };

      // Build payload based on notification type
      switch (form.type) {
        case 'test':
          // Use the unified notification system for test notifications
          await unifiedSendTest();
          toast({
            title: "Test notification sent!",
            description: "You should receive a notification shortly.",
          });
          setIsLoading(false);
          return;
        
        case 'message':
          if (!form.targetValue) {
            throw new Error('Recipient ID is required for message notifications');
          }
          payload = {
            ...payload,
            recipientId: form.targetValue,
            senderName: user?.full_name || user?.username || 'Admin',
            messagePreview: form.body
          };
          break;
        
        case 'follower':
          if (!form.targetValue) {
            throw new Error('Followed User ID is required for follower notifications');
          }
          payload = {
            ...payload,
            followedUserId: form.targetValue,
            followerName: user?.full_name || user?.username || 'Admin'
          };
          break;
        
        case 'campus_event':
          if (!form.targetValue) {
            throw new Error('School domain is required for campus events');
          }
          payload = {
            ...payload,
            schoolDomain: form.targetValue,
            eventTitle: form.title,
            eventTime: new Date().toLocaleString()
          };
          break;
        
        case 'study_reminder':
          if (!form.targetValue) {
            throw new Error('Student ID is required for study reminders');
          }
          payload = {
            ...payload,
            studentId: form.targetValue,
            subject: form.title,
            dueDate: 'Soon'
          };
          break;
        
        case 'custom':
          let customData;
          try {
            customData = JSON.parse(form.customData);
          } catch (e) {
            throw new Error('Invalid JSON in custom data');
          }
          
          payload = {
            ...payload,
            targetType: form.targetType,
            targetId: form.targetValue || undefined,
            message: {
              title: form.title,
              body: form.body,
              data: customData,
              channelId: customData.channelId || 'default'
            }
          };
          break;
      }

       const response = await fetch('/api/push-notifications', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           ...payload,
           userInfo: {
             id: user.id,
             email: user.email,
             role: user.role
           }
         })
       });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Notification Sent!",
          description: "The notification has been sent successfully.",
        });
        
        // Reset form for non-test notifications
        if (form.type !== ('test' as AnnouncementForm['type'])) {
          setForm(prev => ({
            ...prev,
            title: '',
            body: '',
            targetValue: '',
            customData: '{}'
          }));
        }
      } else {
        throw new Error(result.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPreviewUsers = () => {
    switch (form.targetType) {
      case 'user':
        return 1;
      case 'campus':
        return Math.floor(stats.totalUsers / stats.campuses) || 0;
      case 'all':
        return stats.usersWithTokens;
      default:
        return 0;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600">Please sign in to access the admin panel.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-gray-600">You don't have permission to access this admin panel.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Admin Announcements</h1>
          <Badge variant="secondary">Internal Tool</Badge>
        </div>
        <p className="text-gray-600">Send push notifications to test the notification system</p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Push Enabled</p>
                <p className="text-2xl font-bold">{stats.usersWithTokens}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <School className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Campuses</p>
                <p className="text-2xl font-bold">{stats.campuses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={form.type} onValueChange={(value) => setForm(prev => ({ ...prev, type: value as any }))}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="test" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Test
              </TabsTrigger>
              <TabsTrigger value="message" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Message
              </TabsTrigger>
              <TabsTrigger value="follower" className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                Follow
              </TabsTrigger>
              <TabsTrigger value="campus_event" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Event
              </TabsTrigger>
              <TabsTrigger value="study_reminder" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                Study
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Custom
              </TabsTrigger>
            </TabsList>

             <TabsContent value="test" className="space-y-4">
               <Alert>
                 <Bell className="h-4 w-4" />
                 <AlertDescription>
                   Test notifications are sent to your account to verify the notification system is working.
                 </AlertDescription>
               </Alert>
               
               <div className="space-y-2">
                 {Notification.permission !== 'granted' && (
                   <Button 
                     onClick={async () => {
                       try {
                         const permission = await Notification.requestPermission();
                         if (permission === 'granted') {
                           toast({
                             title: "Permission Granted!",
                             description: "You can now receive browser notifications.",
                           });
                         } else {
                           toast({
                             title: "Permission Denied",
                             description: "Browser notifications are disabled.",
                             variant: "destructive"
                           });
                         }
                       } catch (error) {
                         toast({
                           title: "Error",
                           description: "Failed to request notification permission.",
                           variant: "destructive"
                         });
                       }
                     }}
                     className="w-full"
                   >
                     Grant Notification Permission
                   </Button>
                 )}
                 
                 <Button 
                   onClick={async () => {
                     try {
                       await unifiedSendTest();
                       toast({
                         title: "Unified test notification sent!",
                         description: "This uses the same system as the settings page.",
                       });
                     } catch (error) {
                       toast({
                         title: "Error",
                         description: "Failed to send unified test notification.",
                         variant: "destructive"
                       });
                     }
                   }}
                   className="w-full"
                 >
                   Test Unified Notification (Same as Settings)
                 </Button>
                 
                 <Button 
                   onClick={async () => {
                     if ('Notification' in window && Notification.permission === 'granted') {
                       new Notification('Direct PWA Test 🎉', {
                         body: 'This is a direct browser notification test!',
                         icon: '/logo.png',
                         tag: 'direct-test'
                       });
                       toast({
                         title: "Direct PWA notification sent!",
                         description: "Check if you see a browser notification.",
                       });
                     } else {
                       toast({
                         title: "Permission Required",
                         description: "Please grant notification permissions first.",
                         variant: "destructive"
                       });
                     }
                   }}
                   variant="outline"
                   className="w-full"
                 >
                   Test Direct PWA Notification
                 </Button>
                 
                 <p className="text-xs text-gray-500">
                   Current permission: <strong>{Notification.permission}</strong>
                 </p>
               </div>
             </TabsContent>

            <TabsContent value="message" className="space-y-4">
              <div>
                <Label htmlFor="recipient">Recipient User ID</Label>
                <Input
                  id="recipient"
                  placeholder="Enter user ID to send message notification"
                  value={form.targetValue}
                  onChange={(e) => setForm(prev => ({ ...prev, targetValue: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="follower" className="space-y-4">
              <div>
                <Label htmlFor="followed">Followed User ID</Label>
                <Input
                  id="followed"
                  placeholder="Enter user ID who gained a follower"
                  value={form.targetValue}
                  onChange={(e) => setForm(prev => ({ ...prev, targetValue: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="campus_event" className="space-y-4">
              <div>
                <Label htmlFor="campus">Campus Domain</Label>
                <Input
                  id="campus"
                  placeholder="e.g., university.edu"
                  value={form.targetValue}
                  onChange={(e) => setForm(prev => ({ ...prev, targetValue: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="study_reminder" className="space-y-4">
              <div>
                <Label htmlFor="student">Student ID</Label>
                <Input
                  id="student"
                  placeholder="Enter student user ID"
                  value={form.targetValue}
                  onChange={(e) => setForm(prev => ({ ...prev, targetValue: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div>
                <Label htmlFor="targetType">Target Type</Label>
                <Select 
                  value={form.targetType} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, targetType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Single User</SelectItem>
                    <SelectItem value="users">Multiple Users</SelectItem>
                    <SelectItem value="campus">Campus</SelectItem>
                    <SelectItem value="all">All Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.targetType !== 'all' && (
                <div>
                  <Label htmlFor="targetValue">Target Value</Label>
                  <Input
                    id="targetValue"
                    placeholder={
                      form.targetType === 'user' ? 'User ID' :
                      form.targetType === 'users' ? 'Comma-separated user IDs' :
                      'Campus domain'
                    }
                    value={form.targetValue}
                    onChange={(e) => setForm(prev => ({ ...prev, targetValue: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="customData">Custom Data (JSON)</Label>
                <Textarea
                  id="customData"
                  placeholder='{"channelId": "default", "priority": "high"}'
                  value={form.customData}
                  onChange={(e) => setForm(prev => ({ ...prev, customData: e.target.value }))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Common Fields */}
          {form.type !== ('test' as AnnouncementForm['type']) && (
            <>
              <div>
                <Label htmlFor="title">Notification Title</Label>
                <Input
                  id="title"
                  placeholder="Enter notification title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="body">Notification Body</Label>
                <Textarea
                  id="body"
                  placeholder="Enter notification message"
                  value={form.body}
                  onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
                />
              </div>
            </>
          )}

          {/* Preview */}
          {form.type === 'custom' && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">Preview</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Will send to approximately <strong>{getPreviewUsers()}</strong> users
                </p>
                {form.title && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-semibold">{form.title}</p>
                    <p className="text-sm text-gray-600">{form.body}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={handleSendNotification} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send Notification'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
