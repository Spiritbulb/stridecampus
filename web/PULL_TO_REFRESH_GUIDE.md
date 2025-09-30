# Pull-to-Refresh Implementation Guide

## Overview

This implementation provides a comprehensive pull-to-refresh feature that works across all pages in the application. The system is centralized and easy to use.

## Architecture

### Core Components

1. **`usePullToRefresh` Hook** (`src/hooks/usePullToRefresh.ts`)
   - Handles touch/mouse events and pull-to-refresh logic
   - Provides visual feedback and state management
   - Configurable threshold, resistance, and max pull distance

2. **`RefreshContext`** (`src/contexts/RefreshContext.tsx`)
   - Manages refresh functions for different pages
   - Allows pages to register/unregister their refresh functions
   - Provides centralized refresh function lookup

3. **`usePageRefresh` Hook** (`src/hooks/usePageRefresh.ts`)
   - Simple hook for pages to register their refresh functions
   - Automatically handles registration/unregistration based on pathname
   - Makes it easy to add pull-to-refresh to any page

4. **`AuthAwareLayout`** (`src/app/AuthAwareLayout.tsx`)
   - Centralized layout component that handles pull-to-refresh UI
   - Displays pull-to-refresh indicator and handles the refresh logic
   - Works with the RefreshContext to call the appropriate page refresh function

## How to Use

### Adding Pull-to-Refresh to a Page

1. **Import the hook:**
   ```typescript
   import { usePageRefresh } from '@/hooks/usePageRefresh';
   ```

2. **Create a refresh function:**
   ```typescript
   const handleRefresh = useCallback(async () => {
     // Your refresh logic here
     await refetch();
     // Optional: Add a delay for better UX
     await new Promise(resolve => setTimeout(resolve, 800));
   }, [refetch]);
   ```

3. **Register the refresh function:**
   ```typescript
   usePageRefresh(handleRefresh);
   ```

### Example Implementation

```typescript
'use client';
import { useCallback } from 'react';
import { usePageRefresh } from '@/hooks/usePageRefresh';
import { useFeedData } from '@/hooks/useFeedData';

export default function MyPage() {
  const { posts, refetch } = useFeedData();
  
  const handleRefresh = useCallback(async () => {
    await refetch();
    await new Promise(resolve => setTimeout(resolve, 800));
  }, [refetch]);

  usePageRefresh(handleRefresh);

  return (
    <div>
      {/* Your page content */}
    </div>
  );
}
```

## Features

### Visual Feedback
- **Pull indicator**: Shows "Pull to refresh" when pulling down
- **Release indicator**: Shows "Release to refresh" when threshold is reached
- **Loading indicator**: Shows spinning animation during refresh
- **Smooth animations**: Natural pull resistance and smooth transitions

### Configuration
- **Threshold**: Minimum pull distance to trigger refresh (default: 80px)
- **Max pull distance**: Maximum pull distance (default: 120px)
- **Resistance**: Pull resistance factor (default: 2.5)

### Cross-Platform Support
- **Touch events**: Works on mobile devices
- **Mouse events**: Works on desktop for testing
- **Responsive**: Adapts to different screen sizes

## Pages with Pull-to-Refresh

The following pages currently have pull-to-refresh implemented:

- **Feed Page** (`src/components/feed/FeedPage.tsx`)
  - Refreshes posts and spaces data
  
- **Chats Page** (`src/app/chats/page.tsx`)
  - Refreshes chat list and messages
  
- **Library Page** (`src/components/library/Library.tsx`)
  - Refreshes library files
  
- **My Library Page** (`src/components/library/MyLibrary.tsx`)
  - Refreshes user's personal library files
  
- **Space Page** (`src/app/spaces/[slug]/page.tsx`)
  - Refreshes space posts and data
  
- **Settings Page** (`src/app/settings/page.tsx`)
  - Refreshes user settings and profile
  
- **Arena Page** (`src/app/arena/page.tsx`)
  - Refreshes transactions and leaderboard data

## Technical Details

### Touch Event Handling
- Prevents default scroll behavior during pull
- Only allows pull-to-refresh when scrolled to the top
- Handles touch start, move, and end events

### State Management
- Tracks pull distance, pulling state, and refreshing state
- Provides smooth state transitions
- Handles edge cases and error states

### Performance
- Uses `useCallback` to prevent unnecessary re-renders
- Debounced touch events for smooth performance
- Efficient state updates and cleanup

## Troubleshooting

### Common Issues

1. **Pull-to-refresh not working**
   - Ensure the page is scrolled to the top
   - Check that the refresh function is properly registered
   - Verify the page is wrapped in `AuthAwareLayout`

2. **Refresh function not called**
   - Check that `usePageRefresh` is called with the correct refresh function
   - Ensure the refresh function is properly memoized with `useCallback`
   - Verify the pathname matches the registered key

3. **Visual feedback not showing**
   - Check that `AuthAwareLayout` is properly wrapping the page
   - Verify the pull-to-refresh hook is working correctly
   - Ensure CSS classes are not being overridden

### Debug Tips

1. **Check console logs**: The refresh function should log any errors
2. **Test on different devices**: Ensure it works on both mobile and desktop
3. **Verify touch events**: Use browser dev tools to check touch event handling
4. **Check state updates**: Use React DevTools to monitor state changes

## Future Enhancements

- **Customizable indicators**: Allow pages to customize the pull-to-refresh UI
- **Haptic feedback**: Add vibration feedback on mobile devices
- **Pull direction**: Support for different pull directions (left, right, etc.)
- **Custom animations**: Allow custom pull-to-refresh animations
- **Refresh on scroll**: Add infinite scroll with pull-to-refresh
