'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { useUnifiedNotifications } from '@/hooks/useUnifiedNotifications';
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
import { 
  Send, 
  Users, 
  Bell, 
  MessageSquare,
  Target,
  Activity,
  Lock,
  Shield,
  CheckCircle,
  XCircle,
  Zap,
  Database,
  Smartphone,
} from 'lucide-react';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

interface TestForm {
  type: 'test' | 'message' | 'custom';
  title: string;
  body: string;
  targetValue: string;
  customData: string;
}

export default function NotificationSystemTester() {
  const { user: appUser } = useApp();
const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null); 
  const { toast } = useToast();
  
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getNotificationStats,
  } = useEnhancedNotifications(user?.id);
  
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    expoPushToken,
    fcmToken,
    type: notificationType,
    sendTestNotification: sendUnifiedTestNotification,
  } = useUnifiedNotifications();
  
  const [form, setForm] = useState<TestForm>({
    type: 'test',
    title: '',
    body: '',
    targetValue: '',
    customData: '{}',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Simplified authorization - allow all authenticated users for testing
  const isAuthorized = appUser && user;

  useEffect(() => {
    if (isAuthorized) {
      loadStats();
    }
  }, [isAuthorized]);

  const loadStats = async () => {
    try {
      const notificationStats = await getNotificationStats();
      setStats(notificationStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!isAuthorized) {
      toast({
        title: "Unauthorized",
        description: "Please sign in to send notifications.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // For simple test notifications, use the unified test function
      if (form.type === 'test') {
        try {
          await sendUnifiedTestNotification();
          
          setTestResults(prev => [{
            id: Date.now(),
            type: 'test',
            result: [{ success: true }],
            timestamp: new Date().toISOString(),
          }, ...prev]);
          
          toast({
            title: "Test notification sent!",
            description: "Check your device for the notification.",
          });
        } catch (error) {
          throw new Error('Failed to send test notification');
        }
        setIsLoading(false);
        return;
      }

      // For other types, create a database notification directly
      const notificationData: any = {
        user_id: user.id,
        recipient_id: form.targetValue || user.id,
        sender_id: user.id,
        title: form.title || 'Test Notification',
        message: form.body || 'This is a test message',
        type: form.type,
        is_read: false,
      };

      // Import supabase if needed
      const { supabase } = await import('@/utils/supabaseClient');
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) throw error;

      setTestResults(prev => [{
        id: Date.now(),
        type: form.type,
        result: [{ success: true, data }],
        timestamp: new Date().toISOString(),
      }, ...prev]);

      toast({
        title: "Notification created!",
        description: "The notification has been added to the database.",
      });

      // Refresh stats and notifications
      await loadStats();
      await refreshNotifications();

      // Reset form
      setForm(prev => ({
        ...prev,
        title: '',
        body: '',
        targetValue: '',
      }));

    } catch (error) {
      console.error('Error sending notification:', error);
      
      setTestResults(prev => [{
        id: Date.now(),
        type: form.type,
        result: [{ success: false, error: error instanceof Error ? error.message : 'Unknown error' }],
        timestamp: new Date().toISOString(),
      }, ...prev]);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDeliveryStatus = (result: any) => {
    if (!result || !Array.isArray(result)) {
      return { success: false, details: 'No result data' };
    }

    const totalSent = result.length;
    const successful = result.filter((r: any) => r.success).length;
    const failed = totalSent - successful;

    return {
      success: successful > 0,
      totalSent,
      successful,
      failed,
      details: result,
    };
  };

  if (!appUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600">Please sign in to access the notification tester.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Notification System Tester</h1>
          <Badge variant="secondary">Testing Mode</Badge>
        </div>
        <p className="text-gray-600">Test notifications and view delivery status</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Realtime Status</p>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <p className="text-sm font-bold">{isConnected ? 'Connected' : 'Disconnected'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Smartphone className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mobile Users</p>
                <p className="text-2xl font-bold">{stats?.usersWithExpoTokens || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Push Token Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Type</Label>
              <p className="text-lg font-bold capitalize">{notificationType}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Permission</Label>
              <div className="flex items-center gap-2">
                {pushPermission === 'granted' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <p className="text-lg font-bold capitalize">{pushPermission}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Token</Label>
              <div className="flex items-center gap-2">
                {(expoPushToken || fcmToken) ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <p className="text-lg font-bold">
                  {(expoPushToken || fcmToken) ? 'Available' : 'None'}
                </p>
              </div>
            </div>
          </div>
          
          {(expoPushToken || fcmToken) && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Current Token</Label>
              <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                <p className="text-xs font-mono break-all">
                  {expoPushToken || fcmToken}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notification Tester */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Test Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={form.type} onValueChange={(value) => setForm(prev => ({ ...prev, type: value as any }))}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="test">
                  <Activity className="h-4 w-4 mr-1" />
                  Test
                </TabsTrigger>
                <TabsTrigger value="custom">
                  <Target className="h-4 w-4 mr-1" />
                  Custom
                </TabsTrigger>
                <TabsTrigger value="message">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Message
                </TabsTrigger>
              </TabsList>

              <TabsContent value="test" className="space-y-4">
                <Alert>
                  <Bell className="h-4 w-4" />
                  <AlertDescription>
                    Sends a test notification to your device.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div>
                  <Label htmlFor="customTitle">Title</Label>
                  <Input
                    id="customTitle"
                    placeholder="Notification title"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="customBody">Body</Label>
                  <Textarea
                    id="customBody"
                    placeholder="Notification message"
                    value={form.body}
                    onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="message" className="space-y-4">
                <div>
                  <Label htmlFor="recipient">Recipient User ID (optional)</Label>
                  <Input
                    id="recipient"
                    placeholder="Leave empty to send to yourself"
                    value={form.targetValue}
                    onChange={(e) => setForm(prev => ({ ...prev, targetValue: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="messageBody">Message</Label>
                  <Textarea
                    id="messageBody"
                    placeholder="Enter message"
                    value={form.body}
                    onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

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

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No test results yet</p>
              ) : (
                testResults.map((test) => {
                  const deliveryStatus = getDeliveryStatus(test.result);
                  return (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={deliveryStatus.success ? "default" : "destructive"}>
                          {test.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(test.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {deliveryStatus.success ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Delivered successfully</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Delivery failed</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshNotifications}>
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark All Read
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {notificationsLoading ? (
              <p className="text-gray-500 text-center py-4">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications yet</p>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{notification.title}</h4>
                      {!notification.is_read && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  {!notification.is_read && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}