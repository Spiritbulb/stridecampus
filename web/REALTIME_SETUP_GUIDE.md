# Realtime Setup Guide for Posts, Votes, and Comments

This guide explains how to set up realtime subscriptions for posts, voting, and comments in your Stride Campus application.

## 🚀 Quick Setup

### 1. Enable Realtime in Database

Run the SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste contents from database/enable_posts_realtime.sql
```

This enables realtime for:
- `posts` table
- `post_votes` table  
- `comment_votes` table
- `comments` table
- `post_shares` table

### 2. Set up RLS Policies for Comment Votes

If you're getting 406 errors on comment votes, run:

```sql
-- Copy and paste contents from database/comment_votes_rls_policies.sql
```

## 📡 Available Hooks

### `useRealtimePosts`

Comprehensive hook for post-related realtime events:

```typescript
import { useRealtimePosts } from '@/hooks/useRealtimePosts';

const { isConnected, activeChannels } = useRealtimePosts({
  spaceId: 'optional-space-id', // Filter to specific space
  postId: 'optional-post-id',   // Filter to specific post
  onPostCreated: (post) => {
    console.log('New post:', post);
    // Update your posts list
  },
  onPostUpdated: (post) => {
    console.log('Post updated:', post);
    // Update existing post
  },
  onPostDeleted: (postId) => {
    console.log('Post deleted:', postId);
    // Remove from posts list
  },
  onPostVoteChanged: (vote) => {
    console.log('Post vote changed:', vote);
    // Update vote counts
  },
  onCommentVoteChanged: (vote) => {
    console.log('Comment vote changed:', vote);
    // Update comment vote counts
  },
  onCommentCreated: (comment) => {
    console.log('New comment:', comment);
    // Add to comments list
  },
  onCommentDeleted: (commentId) => {
    console.log('Comment deleted:', commentId);
    // Remove from comments list
  }
});
```

### `useRealtimeVoting`

Specialized hook for voting events:

```typescript
import { useRealtimeVoting } from '@/hooks/useRealtimeVoting';

const { isConnected, voteUpdates, latestUpdate } = useRealtimeVoting({
  postId: 'optional-post-id',       // Filter to specific post
  commentId: 'optional-comment-id', // Filter to specific comment
  onVoteUpdate: (update) => {
    console.log('Vote update:', update);
    // Handle vote changes
    if (update.type === 'post') {
      // Handle post vote
    } else if (update.type === 'comment') {
      // Handle comment vote
    }
  }
});
```

## 🔧 Component Integration

### Post Components

The following components now have realtime voting:

- `VoteSection.tsx` - Real-time post voting
- `CommentComponent.tsx` - Real-time comment voting

### Usage Example

```typescript
// In your post list component
const { isConnected } = useRealtimePosts({
  spaceId: currentSpace?.id,
  onPostCreated: (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  },
  onPostVoteChanged: (vote) => {
    setPosts(prev => prev.map(post => 
      post.id === vote.post_id 
        ? { ...post, vote_count: calculateNewVoteCount(post, vote) }
        : post
    ));
  }
});
```

## 🎯 Features

### Real-time Updates
- ✅ Post creation, updates, and deletion
- ✅ Post voting (upvotes/downvotes)
- ✅ Comment voting (likes)
- ✅ Comment creation and deletion
- ✅ Automatic UI updates without page refresh

### Performance Optimizations
- ✅ Filtered subscriptions (by space, post, or comment)
- ✅ Automatic cleanup on component unmount
- ✅ Connection status monitoring
- ✅ Error handling and logging

### User Experience
- ✅ Instant feedback on actions
- ✅ Live vote counts
- ✅ Real-time comment updates
- ✅ Connection status indicators

## 🐛 Troubleshooting

### Common Issues

1. **406 Not Acceptable Error**
   - Run the RLS policies script for comment_votes
   - Check that user is authenticated

2. **Realtime Not Working**
   - Verify tables are added to supabase_realtime publication
   - Check browser console for connection errors
   - Ensure RLS policies allow SELECT access

3. **Vote Counts Not Updating**
   - Check that both post_votes and comment_votes have realtime enabled
   - Verify the onVoteUpdate callback is properly handling updates

### Debug Tools

Enable debug logging by checking browser console for:
- `🔌 Setting up realtime subscriptions`
- `📡 Subscription status`
- `🔄 Realtime vote update`
- `❌ Subscription failed`

## 📊 Monitoring

The hooks provide connection status and active channels:

```typescript
const { isConnected, activeChannels } = useRealtimePosts();

console.log('Realtime connected:', isConnected);
console.log('Active channels:', activeChannels);
```

## 🔐 Security

All realtime subscriptions respect Row Level Security (RLS) policies:
- Users can only see data they have permission to access
- Vote updates are filtered by user permissions
- Authentication is required for all operations

## 🚀 Next Steps

1. Run the database setup scripts
2. Import and use the hooks in your components
3. Test realtime functionality across multiple browser tabs
4. Monitor performance and connection status
5. Add error handling for offline scenarios

The realtime system is now ready to provide instant updates for posts, votes, and comments across your application!

