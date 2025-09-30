# Push Notifications Setup Guide

## Overview

Your Stride Campus app now has comprehensive push notification support that works seamlessly between the mobile app (Expo) and web browsers (PWA). The system automatically detects the environment and uses the appropriate notification method.

## Features Implemented

### ✅ Mobile App (Expo) Notifications
- Native push notifications through Expo's push service
- Proper Android notification channels (Messages, Social, Events, Academic, Default)
- Custom notification sounds and vibration patterns
- Deep linking support for navigation from notifications
- Automatic permission handling
- Background notification processing

### ✅ Web Browser (PWA) Notifications
- Service Worker-based push notifications for web browsers
- Fallback support when not in the mobile app
- Browser notification API integration
- Click-to-navigate functionality

### ✅ Unified Notification System
- Automatic detection of mobile app vs. web browser
- Consistent API across platforms
- Smart fallback mechanisms
- Centralized notification management

### ✅ Enhanced Settings UI
- Visual status indicators for notification state
- Platform-specific messaging (Mobile App vs Web Browser)
- Test notification functionality
- Real-time permission status updates
- Error handling with user-friendly messages

## How It Works

### 1. Environment Detection
The system automatically detects whether the user is:
- In the mobile app (Expo WebView)
- In a web browser (PWA mode)
- On an unsupported platform

### 2. Communication Flow (Mobile App)
```
Mobile App ←→ WebView
     ↓
Expo Push Service
     ↓
User's Device
```

### 3. Communication Flow (Web Browser)
```
Web App ←→ Service Worker
     ↓
Browser Push API
     ↓
User's Browser
```

## Files Modified/Created

### Core Files
- `mobile/Stride/App.tsx` - Enhanced Expo app with better communication
- `src/hooks/useExpoPushNotifications.ts` - Improved Expo notification hook
- `src/hooks/usePwaNotifications.ts` - New PWA notification support
- `src/hooks/useUnifiedNotifications.ts` - Unified notification interface
- `src/app/settings/page.tsx` - Enhanced settings UI
- `public/sw.js` - Improved service worker for PWA notifications

### API & Services
- `src/app/api/push-notifications/route.ts` - Backend notification API
- `src/utils/pushNotificationService.ts` - Notification service layer

## Testing Guide

### Mobile App Testing

1. **Build and Install the Mobile App**
   ```bash
   cd mobile/Stride
   npx expo build:android  # or build:ios
   ```

2. **Test Notification Flow**
   - Open the app on a physical device
   - Navigate to Settings → Notifications
   - Toggle push notifications ON
   - Grant permission when prompted
   - Click "Send Test Notification"
   - Verify notification appears

3. **Test Deep Linking**
   - Send a notification with URL data
   - Tap the notification
   - Verify app navigates to correct page

### Web Browser Testing

1. **Open in Supported Browser**
   - Chrome, Firefox, Safari (latest versions)
   - Navigate to your PWA

2. **Test Notification Flow**
   - Go to Settings → Notifications
   - Should show "Web Browser" badge
   - Toggle notifications ON
   - Grant browser permission
   - Click "Send Test Notification"

### Backend Testing

1. **Test API Endpoints**
   ```bash
   # Test notification sending
   curl -X POST https://your-domain.com/api/push-notifications \
     -H "Content-Type: application/json" \
     -d '{"type": "test"}'
   
   # Check notification status
   curl https://your-domain.com/api/push-notifications
   ```

## Configuration

### Expo App Configuration
The app is configured with:
- Project ID: `7ad0defb-2d05-4a03-ad2b-bfcff8ea40b8`
- Notification channels for different types
- Background modes for iOS
- Proper Android permissions

### Database Schema
Required user table columns:
- `expo_push_token` (text, nullable)
- `push_notifications` (boolean, default: true)
- `email_notifications` (boolean, default: true)
- `marketing_emails` (boolean, default: false)

## Notification Types Supported

### Predefined Types
1. **Messages** - Direct messages and chat notifications
2. **Social** - Likes, comments, follows
3. **Events** - Campus events and announcements
4. **Academic** - Study reminders and academic notifications
5. **Test** - Test notifications for verification

### Usage Examples
```javascript
// Send a test notification
await fetch('/api/push-notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'test' })
});

// Send a message notification
await fetch('/api/push-notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'message',
    recipientId: 'user-id',
    senderName: 'John Doe',
    messagePreview: 'Hey, how are you?'
  })
});
```

## Troubleshooting

### Common Issues

1. **Notifications not working in mobile app**
   - Verify Expo build includes notification permissions
   - Check device notification settings
   - Ensure push token is valid and stored

2. **Notifications not working in browser**
   - Check browser notification permissions
   - Verify service worker is registered
   - Ensure HTTPS is used (required for notifications)

3. **Permission denied**
   - Guide users to device/browser settings
   - Provide clear instructions for re-enabling
   - Show appropriate error messages

### Debug Commands

```bash
# Check Expo build
npx expo doctor

# Verify service worker
console.log(navigator.serviceWorker.controller);

# Check notification permission
console.log(Notification.permission);
```

## Security Considerations

1. **Token Storage** - Expo push tokens are securely stored in database
2. **Permission Handling** - Proper permission request flow
3. **Data Validation** - All notification data is validated server-side
4. **Rate Limiting** - API endpoints should implement rate limiting

## Next Steps

### Potential Enhancements
1. **Rich Notifications** - Add images, action buttons
2. **Scheduled Notifications** - Time-based notifications
3. **Geofencing** - Location-based notifications
4. **Advanced Analytics** - Notification engagement tracking
5. **A/B Testing** - Notification content optimization

### Monitoring
- Track notification delivery rates
- Monitor user engagement with notifications
- Analyze notification preferences and trends

## Support

For issues or questions about the push notification system:
1. Check the troubleshooting section above
2. Review console logs for errors
3. Test with the provided endpoints
4. Verify all configuration steps are completed

The system is designed to be robust and user-friendly, with automatic fallbacks and clear error messaging to ensure the best possible user experience across all platforms.

