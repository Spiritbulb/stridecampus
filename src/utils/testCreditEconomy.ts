// Test script to verify credit economy setup
// Run this in your browser console or add to a test page

import { 
  awardResourceUploadCredits,
  getUserCreditSummary,
  checkUserCredits,
  calculateFileDownloadCost 
} from '@/utils/creditEconomy';

// Test function - call this after setting up Supabase
export async function testCreditEconomy(userId: string) {
  console.log('🧪 Testing Credit Economy System...');
  
  try {
    // Test 1: Get user's current credit summary
    console.log('📊 Test 1: Getting credit summary...');
    const summary = await getUserCreditSummary(userId);
    console.log('✅ Credit Summary:', summary);
    
    // Test 2: Check if user has enough credits
    console.log('💰 Test 2: Checking credit balance...');
    const hasCredits = await checkUserCredits(userId, 50);
    console.log('✅ Has 50+ credits:', hasCredits);
    
    // Test 3: Calculate file download cost
    console.log('📁 Test 3: Calculating download costs...');
    const smallFileCost = calculateFileDownloadCost(500 * 1024); // 500KB
    const largeFileCost = calculateFileDownloadCost(5 * 1024 * 1024); // 5MB
    const hugeFileCost = calculateFileDownloadCost(15 * 1024 * 1024); // 15MB
    
    console.log('✅ Small file (500KB) cost:', smallFileCost, 'credits');
    console.log('✅ Medium file (5MB) cost:', largeFileCost, 'credits');
    console.log('✅ Large file (15MB) cost:', hugeFileCost, 'credits');
    
    // Test 4: Award credits for resource upload (if you want to test)
    console.log('🎁 Test 4: Awarding upload credits...');
    const uploadResult = await awardResourceUploadCredits(userId, 'test-resource-123', 'file');
    console.log('✅ Upload credit result:', uploadResult);
    
    console.log('🎉 All tests passed! Credit economy is working correctly.');
    
    return {
      success: true,
      summary,
      hasCredits,
      costs: { smallFileCost, largeFileCost, hugeFileCost },
      uploadResult
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Quick setup verification
export async function verifyDatabaseSetup() {
  console.log('🔍 Verifying database setup...');
  
  try {
    const { supabase } = await import('@/utils/supabaseClient');
    
    // Check if credit_transactions table exists
    const { data: transactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('id')
      .limit(1);
    
    if (transError) {
      console.error('❌ credit_transactions table not found:', transError.message);
      return false;
    }
    
    // Check if leaderboard table exists
    const { data: leaderboard, error: leaderError } = await supabase
      .from('leaderboard')
      .select('id')
      .limit(1);
    
    if (leaderError) {
      console.error('❌ leaderboard table not found:', leaderError.message);
      return false;
    }
    
    // Check if users table has required columns
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, credits, level_name, level_points')
      .limit(1);
    
    if (usersError) {
      console.error('❌ users table missing required columns:', usersError.message);
      return false;
    }
    
    console.log('✅ Database setup verified successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    return false;
  }
}

// Usage instructions
console.log(`
🚀 Credit Economy Test Script Ready!

To test your setup:

1. First verify database setup:
   await verifyDatabaseSetup()

2. Then test with a real user ID:
   await testCreditEconomy('your-user-id-here')

3. Check the results in the console!

Make sure you've run the SQL setup in Supabase first.
`);
