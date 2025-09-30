# AI Context Integration for Stride Campus

## Overview

This document describes the comprehensive AI context system implemented for Nia, the AI assistant on Stride Campus. The system provides rich, personalized context while optimizing for token efficiency and performance.

## 🎯 Key Features

### 1. **Comprehensive User Context**
- **Profile Data**: Username, school, level, credits, verification status
- **Spaces**: Joined spaces, admin roles, recent activity
- **Resources**: Uploaded files, purchased resources, top categories
- **Credit Activity**: Current level, balance, recent transactions
- **Social Metrics**: Posts, followers, upvotes received

### 2. **Token Optimization**
- **Data Summarization**: Only essential metrics, not raw data
- **Caching**: 5-minute cache to avoid repeated API calls
- **Efficient Formatting**: Compact string representation
- **Smart Limits**: Limited data fetching (10-20 items max)

### 3. **Platform Knowledge**
- **Complete Platform Understanding**: What Stride Campus is and does
- **Credit Economy**: How earning/spending works
- **Value Proposition**: Why students should use the platform
- **Target Audience**: Kenyan university students

### 4. **Subtle Contextual Guidance**
- **Conversation-Led**: Only provides hints when user asks about relevant topics
- **Non-Pushy**: Doesn't force platform features unless contextually appropriate
- **Natural Integration**: Suggestions feel organic to the conversation

## 🏗️ Architecture

### Core Components

```
src/components/layout/ai/utils/
├── contextProvider.ts    # Main context fetching and optimization
├── prompts.ts           # AI prompt building with context
├── api.ts              # API integration with async prompts
└── testContextProvider.ts # Testing and benchmarking utilities
```

### Data Flow

1. **User sends message** → `useChat` hook
2. **Context fetching** → `fetchUserContext()` with caching
3. **Prompt building** → `buildContextPrompt()` with full context
4. **AI API call** → Enhanced prompt sent to AI model
5. **Response** → Context-aware Nia response

## 📊 Context Data Structure

```typescript
interface OptimizedUserContext {
  profile: {
    username: string;
    school: string;
    level: string;
    credits: number;
    verified: boolean;
  };
  spaces: {
    joined: number;
    admin: number;
    recent: string[]; // Last 3 space names
  };
  resources: {
    uploaded: number;
    purchased: number;
    categories: string[]; // Top 3 categories
  };
  credits: {
    level: string;
    balance: number;
    recentActivity: string; // Last 3 transaction types
  };
  social: {
    posts: number;
    followers: number;
    upvotes: number;
  };
}
```

## 🚀 Token Optimization Strategies

### 1. **Data Summarization**
- **Spaces**: Count + recent names (not full details)
- **Resources**: Count + top categories (not full metadata)
- **Transactions**: Recent activity types (not full history)
- **Social**: Aggregated metrics (not individual posts)

### 2. **Caching System**
```typescript
const contextCache = new Map<string, { context: OptimizedUserContext; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

### 3. **Efficient String Format**
```
User Context:
- username (school) - level level, X credits
- Joined X spaces (X admin), recent: space1, space2, space3
- Uploaded X resources, purchased X, top categories: cat1, cat2, cat3
- Recent activity: activity1, activity2, activity3
- Social: X posts, X followers, X upvotes
```

### 4. **Smart Limits**
- **Spaces**: Max 10 memberships fetched
- **Resources**: Max 20 uploaded files
- **Posts**: Max 10 posts for metrics
- **Archive**: Max 5 purchased resources
- **Transactions**: Max 10 recent transactions

## 🎭 Enhanced Nia Persona

### New Capabilities
- **Context Awareness**: References specific user data naturally when relevant
- **Platform Knowledge**: Understands Stride Campus completely
- **Conversation-Led**: Lets users guide the conversation naturally
- **Subtle Guidance**: Provides hints only when contextually appropriate
- **Token Efficiency**: Keeps responses concise (1-2 sentences)

### Personality Traits
- **Impressive & Authentic**: Genuinely smart, driven student
- **Concise Communicator**: Short responses to save tokens
- **Personal Touch**: Uses user's name and data naturally
- **Gen Z Kenyan**: Mixes English with Sheng
- **Context-Aware**: Mentions specific user metrics when relevant

## 📈 Performance Metrics

### Expected Token Usage
- **Platform Context**: ~200 tokens (static)
- **User Context**: ~50-100 tokens (varies by activity)
- **Selling Points**: ~20-50 tokens (personalized)
- **Conversation History**: ~100-200 tokens (6 recent messages)
- **Total per request**: ~400-600 tokens

### Caching Benefits
- **First request**: ~500-800ms (database queries)
- **Cached requests**: ~1-5ms (memory lookup)
- **Cache hit rate**: ~80-90% (5-minute window)

## 🧪 Testing & Monitoring

### Test Suite
```typescript
// Run comprehensive tests
import { runAllTests } from './testContextProvider';
const results = await runAllTests();
```

### Available Tests
1. **Context Provider Test**: Full context fetching
2. **Token Optimization Test**: Different user scenarios
3. **Performance Benchmark**: Speed and caching metrics
4. **Cache Management**: Cache stats and clearing

### Monitoring
```typescript
// Get cache statistics
import { getCacheStats } from './contextProvider';
const stats = getCacheStats();
console.log(`Cache size: ${stats.size}, Entries: ${stats.entries}`);
```

## 🔧 Usage Examples

### Basic Integration
```typescript
import { fetchUserContext, contextToString } from './contextProvider';

// Fetch user context
const context = await fetchUserContext(user);

// Convert to string for AI
const contextString = contextToString(context);

// Use in AI prompt
const prompt = `User Context: ${contextString}\n\nUser: Hello Nia!`;
```

### Advanced Usage
```typescript
import { getSellingPoints, clearContextCache } from './contextProvider';

// Get personalized selling points
const sellingPoints = getSellingPoints(context);

// Clear cache when user data changes
clearContextCache(user.id);
```

## 🎯 Contextual Hints Logic

The system provides subtle hints only when conversationally relevant:

### Credit-Related Questions
- **User asks about credits/earning**: If low balance (< 50), hint about earning opportunities
- **Natural integration**: Only when user initiates the topic

### Space-Related Questions  
- **User asks about communities**: If few spaces (< 2), hint about exploring more
- **Contextual relevance**: Only when discussing spaces/joining

### Resource-Related Questions
- **User asks about sharing**: If few uploads (< 3), hint about sharing benefits
- **Organic suggestions**: Only when user mentions uploading/sharing

### Level-Related Questions
- **User asks about progression**: If early level, hint about leveling up
- **Conversation-driven**: Only when user asks about status/progress

### Engagement-Related Questions
- **User asks about participation**: If few posts (< 2), hint about engagement
- **Natural flow**: Only when discussing posting/discussion

## 🚀 Future Enhancements

### Planned Improvements
1. **Dynamic Context**: Adjust context based on conversation topic
2. **Predictive Caching**: Pre-fetch context for active users
3. **Context Compression**: Further token optimization
4. **Real-time Updates**: Live context updates during conversation
5. **Analytics**: Track context effectiveness and user engagement

### Integration Opportunities
1. **Notification System**: Context-aware notifications
2. **Recommendation Engine**: Personalized content suggestions
3. **Gamification**: Level-based AI responses
4. **Analytics Dashboard**: Context usage metrics

## 📝 Implementation Notes

### Database Queries
- All queries use parallel execution for performance
- Limited result sets to prevent large data transfers
- Error handling with fallback minimal context

### Memory Management
- Cache automatically expires after 5 minutes
- Manual cache clearing available for testing
- Memory-efficient data structures

### Error Handling
- Graceful degradation on API failures
- Fallback to minimal context
- Comprehensive error logging

## 🎉 Benefits

### For Users
- **Personalized Experience**: AI knows their specific situation
- **Relevant Recommendations**: Tailored platform suggestions
- **Efficient Interactions**: Faster, more accurate responses

### For Platform
- **Increased Engagement**: Personalized incentives
- **Better Retention**: Context-aware user guidance
- **Data-Driven Insights**: Understanding user behavior patterns

### For Development
- **Maintainable Code**: Clean, modular architecture
- **Testable System**: Comprehensive test suite
- **Scalable Design**: Efficient caching and optimization

---

This AI context system transforms Nia from a basic chatbot into a sophisticated, context-aware assistant that understands each user's unique situation and can provide personalized guidance for maximizing their Stride Campus experience.
