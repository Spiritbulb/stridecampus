// Test script for the new realtime notification system
// Run this to test if everything is working correctly

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://laqocctbodlexjkfpfwh.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtimeNotifications() {
  console.log('🧪 Testing realtime notification system...\n');

  try {
    // 1. Test database connection
    console.log('1️⃣ Testing database connection...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, expo_push_token, push_notifications')
      .limit(1);

    if (usersError) {
      console.error('❌ Database connection failed:', usersError);
      return;
    }

    console.log('✅ Database connection successful');
    console.log(`   Found ${users.length} users`);

    if (users.length === 0) {
      console.log('⚠️ No users found. Create a user first to test notifications.');
      return;
    }

    const testUser = users[0];
    console.log(`   Test user: ${testUser.full_name} (${testUser.id})`);
    console.log(`   Push notifications enabled: ${testUser.push_notifications}`);
    console.log(`   Has Expo token: ${!!testUser.expo_push_token}\n`);

    // 2. Test notification creation
    console.log('2️⃣ Testing notification creation...');
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: testUser.id,
        recipient_id: testUser.id,
        sender_id: testUser.id,
        type: 'test',
        title: 'Test Notification 🧪',
        message: 'This is a test notification from the database trigger system',
        data: { type: 'test', timestamp: new Date().toISOString() },
        is_read: false
      })
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Notification creation failed:', notificationError);
      return;
    }

    console.log('✅ Notification created successfully');
    console.log(`   Notification ID: ${notification.id}\n`);

    // 3. Check if notification was queued
    console.log('3️⃣ Checking notification queue...');
    
    // Wait a moment for the trigger to fire
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: queueItems, error: queueError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('notification_id', notification.id);

    if (queueError) {
      console.error('❌ Queue check failed:', queueError);
      return;
    }

    if (queueItems && queueItems.length > 0) {
      console.log('✅ Notification queued successfully');
      console.log(`   Queue ID: ${queueItems[0].id}`);
      console.log(`   Status: ${queueItems[0].status}`);
      console.log(`   Expo token: ${queueItems[0].expo_push_token}`);
    } else {
      console.log('⚠️ Notification not queued. Possible issues:');
      console.log('   - Database trigger not enabled');
      console.log('   - User push notifications disabled');
      console.log('   - User has no Expo push token');
    }

    // 4. Test realtime subscription
    console.log('\n4️⃣ Testing realtime subscription...');
    
    let subscriptionReceived = false;
    const channel = supabase
      .channel('test-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${testUser.id}`
        },
        (payload) => {
          console.log('✅ Realtime notification received!');
          console.log(`   Title: ${payload.new.title}`);
          console.log(`   Message: ${payload.new.message}`);
          subscriptionReceived = true;
        }
      )
      .subscribe();

    // Wait for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (channel.state === 'joined') {
      console.log('✅ Realtime subscription active');
      
      // Send another test notification to test realtime
      console.log('   Sending test notification for realtime test...');
      const { error: realtimeTestError } = await supabase
        .from('notifications')
        .insert({
          user_id: testUser.id,
          recipient_id: testUser.id,
          sender_id: testUser.id,
          type: 'test',
          title: 'Realtime Test 🔔',
          message: 'Testing realtime subscription',
          data: { type: 'test', realtime: true },
          is_read: false
        });

      if (realtimeTestError) {
        console.error('❌ Realtime test notification failed:', realtimeTestError);
      } else {
        // Wait for realtime event
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (subscriptionReceived) {
          console.log('✅ Realtime subscription working perfectly!');
        } else {
          console.log('⚠️ Realtime subscription not receiving events');
        }
      }
    } else {
      console.log('❌ Realtime subscription failed to join');
    }

    // Cleanup
    channel.unsubscribe();

    // 5. Summary
    console.log('\n📊 Test Summary:');
    console.log('   Database connection: ✅');
    console.log('   Notification creation: ✅');
    console.log('   Queue processing: ' + (queueItems && queueItems.length > 0 ? '✅' : '⚠️'));
    console.log('   Realtime subscription: ' + (subscriptionReceived ? '✅' : '⚠️'));

    if (queueItems && queueItems.length > 0 && subscriptionReceived) {
      console.log('\n🎉 All tests passed! Your realtime notification system is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the setup guide for troubleshooting.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testRealtimeNotifications().then(() => {
  console.log('\n✨ Test completed. Exiting...');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
