# StrideCampus Credit Economy System

## Overview

The StrideCampus credit economy is a comprehensive system that rewards user engagement and content creation while providing meaningful progression through a level system. Users earn credits through various activities and can spend them on premium features.

## 🏆 Level System

### Level Progression
Users progress through 10 levels based on **total credits earned** (not current balance):

1. **Novice** (0 credits) - Starting level
2. **Apprentice** (100 credits) - Early engagement
3. **Scholar** (300 credits) - Active participation
4. **Expert** (600 credits) - Regular contributor
5. **Master** (1,000 credits) - Established member
6. **Sage** (1,500 credits) - Knowledgeable user
7. **Luminary** (2,200 credits) - Community leader
8. **Legend** (3,000 credits) - Elite member
9. **Mythic** (4,000 credits) - Rare achievement
10. **Transcendent** (5,000 credits) - Maximum level

### Level Benefits
- **Visual Recognition**: Each level has unique colors and icons
- **Status Display**: Level badges appear in profiles and leaderboards
- **Progression Tracking**: Progress bars show advancement to next level

## 💰 Credit Earning Rules

### Resource Uploads
- **File Upload**: +20 credits
- **Link Upload**: +20 credits
- **Resource Types**: YouTube videos, articles, documents, websites

### Social Engagement
- **Upvotes Received**: +1 credit per upvote on posts
- **Follower Milestones**: +10 credits every 100 new followers
- **Daily Login**: +5 credits for consecutive daily logins

### AI Interaction
- **Nia Chat Bonus**: Random 1-20 credits for engaging conversations
- **Maximum per Session**: 20 credits (prevents farming)

### Welcome Bonus
- **New Users**: +120 credits upon account creation

## 💸 Credit Spending Rules

### File Downloads
- **Cost Range**: 50-250 credits based on file size
- **Small Files** (≤1MB): 50 credits
- **Large Files** (≥10MB): 250 credits
- **Linear Scaling**: Cost increases proportionally with file size

### AI Services
- **Nia Messages**: 10 credits per message
- **Real-time Chat**: Each interaction costs credits

## 🔧 Implementation Guide

### Database Setup

1. **Run the SQL migration**:
```sql
-- Execute the functions in database/credit_economy_functions.sql
```

2. **Required Tables**:
- `credit_transactions` - All credit movements
- `users` - Credit balance and level info
- `leaderboard` - Real-time rankings

### Using the Credit Economy

#### Basic Usage
```typescript
import { 
  awardResourceUploadCredits,
  chargeFileDownloadCredits,
  getUserCreditSummary 
} from '@/utils/creditEconomy';

// Award credits for upload
await awardResourceUploadCredits(userId, resourceId, 'file');

// Charge for download
const result = await chargeFileDownloadCredits(userId, fileId, fileSizeBytes);
if (result.success) {
  console.log(`Download cost: ${result.cost} credits`);
}

// Get user's credit summary
const summary = await getUserCreditSummary(userId);
```

#### React Hooks
```typescript
import { useCreditEconomy, useLevelProgression } from '@/hooks/useCreditEconomy';

function MyComponent({ userId }) {
  const { creditSummary, hasEnoughCredits } = useCreditEconomy(userId);
  const { levelProgress } = useLevelProgression(userId);
  
  // Check if user can afford something
  const canAfford = await hasEnoughCredits(100);
}
```

#### UI Components
```typescript
import { LevelDisplay, LevelBadge, CreditBalance } from '@/components/ui/LevelDisplay';

// Full level display with progress
<LevelDisplay userId={userId} showProgress={true} />

// Compact level badge
<LevelBadge userId={userId} />

// Credit balance display
<CreditBalance userId={userId} size="lg" />
```

## 🎯 Key Features

### Atomic Transactions
- All credit operations are atomic (all-or-nothing)
- Database functions ensure consistency
- Real-time leaderboard updates

### Anti-Gaming Measures
- Nia chat bonuses are capped per session
- File download costs scale with size
- Level progression based on total earned (not current balance)

### Real-time Updates
- Credit changes update immediately
- Level progression reflects instantly
- Leaderboard updates automatically

### Comprehensive Tracking
- All transactions are logged
- Detailed metadata for each transaction
- Transaction history and analytics

## 📊 Transaction Types

### Earning Transactions
- `resource_upload` - File/link uploads
- `upvote_received` - Social engagement
- `follower_milestone` - Follower achievements
- `nia_chat_bonus` - AI interaction rewards
- `daily_login` - Login streak bonuses
- `welcome_bonus` - New user bonus

### Spending Transactions
- `file_download` - Resource downloads
- `nia_message` - AI chat costs

## 🔄 Integration Points

### Upload System
- File uploads automatically award credits
- Link uploads automatically award credits
- Uses new credit economy functions

### Download System
- File downloads check credit balance
- Costs calculated based on file size
- Insufficient credits prevent download

### AI Chat System
- Each message costs 10 credits
- Random bonuses for engagement
- Session-based bonus limits

### Social Features
- Upvotes award credits to post authors
- Follower milestones trigger bonuses
- Real-time credit updates

## 🚀 Getting Started

1. **Run Database Migration**: Execute `database/credit_economy_functions.sql`
2. **Update Upload Functions**: Already integrated in `src/utils/r2.ts`
3. **Add UI Components**: Use `LevelDisplay`, `LevelBadge`, `CreditBalance`
4. **Implement Downloads**: Use `chargeFileDownloadCredits` before downloads
5. **Add AI Costs**: Use `chargeNiaMessageCredits` for AI interactions

## 📈 Analytics & Monitoring

### Key Metrics to Track
- Average credits per user
- Level distribution
- Most popular earning methods
- Download cost effectiveness
- AI usage patterns

### Database Queries
```sql
-- Top earners by category
SELECT category, SUM(amount) as total_earned
FROM credit_transactions 
WHERE type = 'earn' 
GROUP BY category 
ORDER BY total_earned DESC;

-- Level distribution
SELECT level_name, COUNT(*) as user_count
FROM users 
GROUP BY level_name 
ORDER BY level_points;
```

This credit economy system creates a balanced, engaging progression system that rewards meaningful contributions while providing clear value for spending credits on premium features.
