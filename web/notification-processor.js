// Notification Queue Processor for Expo Push Notifications
// This service processes the notification queue and sends push notifications via Expo

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Supabase configuration
const supabaseUrl = 'https://laqocctbodlexjkfpfwh.supabase.co';
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // Replace with your service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_BATCH_SIZE = 100; // Expo's limit

class NotificationProcessor {
  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
  }

  async startProcessing(intervalMs = 30000) { // Process every 30 seconds by default
    console.log('🚀 Starting notification processor...');
    
    if (this.isProcessing) {
      console.log('⚠️ Processor is already running');
      return;
    }

    this.isProcessing = true;
    
    // Process immediately on start
    await this.processQueue();
    
    // Set up interval for continuous processing
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, intervalMs);
    
    console.log(`✅ Notification processor started (interval: ${intervalMs}ms)`);
  }

  async stopProcessing() {
    console.log('🛑 Stopping notification processor...');
    
    this.isProcessing = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    console.log('✅ Notification processor stopped');
  }

  async processQueue() {
    try {
      // Get pending notifications
      const { data: pendingNotifications, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('status', 'pending')
        .lt('attempts', 3) // Max 3 attempts
        .order('created_at', { ascending: true })
        .limit(50); // Process up to 50 at a time

      if (error) {
        console.error('❌ Error fetching pending notifications:', error);
        return;
      }

      if (!pendingNotifications || pendingNotifications.length === 0) {
        return; // No pending notifications
      }

      console.log(`📬 Processing ${pendingNotifications.length} pending notifications...`);

      // Group notifications by batch for Expo API
      const batches = this.createBatches(pendingNotifications);
      
      for (const batch of batches) {
        await this.processBatch(batch);
      }

    } catch (error) {
      console.error('❌ Error in processQueue:', error);
    }
  }

  createBatches(notifications) {
    const batches = [];
    
    for (let i = 0; i < notifications.length; i += MAX_BATCH_SIZE) {
      batches.push(notifications.slice(i, i + MAX_BATCH_SIZE));
    }
    
    return batches;
  }

  async processBatch(batch) {
    try {
      // Prepare batch data for Expo API
      const messages = batch.map(item => ({
        to: item.expo_push_token,
        title: item.notification_data.title,
        body: item.notification_data.body,
        data: item.notification_data.data,
        channelId: item.notification_data.channelId || 'default'
      }));

      console.log(`📤 Sending batch of ${messages.length} notifications to Expo...`);

      // Send to Expo Push API
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages)
      });

      if (!response.ok) {
        throw new Error(`Expo API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Process results and update queue
      await this.updateQueueStatus(batch, result);

    } catch (error) {
      console.error('❌ Error processing batch:', error);
      
      // Mark all notifications in batch as failed
      await this.markBatchAsFailed(batch, error.message);
    }
  }

  async updateQueueStatus(batch, expoResult) {
    const queueIds = batch.map(item => item.id);
    
    // Check if Expo returned receipts
    if (expoResult.data && Array.isArray(expoResult.data)) {
      // Expo returns receipts for each message
      for (let i = 0; i < batch.length; i++) {
        const queueItem = batch[i];
        const receipt = expoResult.data[i];
        
        if (receipt && receipt.status === 'ok') {
          // Success
          await supabase
            .from('notification_queue')
            .update({
              status: 'sent',
              processed_at: new Date().toISOString(),
              attempts: queueItem.attempts + 1,
              last_attempt_at: new Date().toISOString()
            })
            .eq('id', queueItem.id);
            
          console.log(`✅ Notification sent successfully: ${queueItem.id}`);
        } else {
          // Failed
          const errorMessage = receipt ? receipt.message || 'Unknown error' : 'No receipt received';
          await supabase
            .from('notification_queue')
            .update({
              status: queueItem.attempts + 1 >= 3 ? 'failed' : 'pending',
              attempts: queueItem.attempts + 1,
              last_attempt_at: new Date().toISOString(),
              error_message: errorMessage
            })
            .eq('id', queueItem.id);
            
          console.log(`❌ Notification failed: ${queueItem.id} - ${errorMessage}`);
        }
      }
    } else {
      // No receipts - assume all failed
      await this.markBatchAsFailed(batch, 'No receipts received from Expo');
    }
  }

  async markBatchAsFailed(batch, errorMessage) {
    const queueIds = batch.map(item => item.id);
    
    await supabase
      .from('notification_queue')
      .update({
        status: 'failed',
        attempts: supabase.raw('attempts + 1'),
        last_attempt_at: new Date().toISOString(),
        error_message: errorMessage
      })
      .in('id', queueIds);
      
    console.log(`❌ Marked ${batch.length} notifications as failed: ${errorMessage}`);
  }

  // Clean up old processed notifications (optional)
  async cleanupOldNotifications(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const { error } = await supabase
        .from('notification_queue')
        .delete()
        .in('status', ['sent', 'failed'])
        .lt('processed_at', cutoffDate.toISOString());
        
      if (error) {
        console.error('❌ Error cleaning up old notifications:', error);
      } else {
        console.log(`🧹 Cleaned up notifications older than ${daysOld} days`);
      }
    } catch (error) {
      console.error('❌ Error in cleanup:', error);
    }
  }
}

// Export for use as a module
module.exports = NotificationProcessor;

// If running directly, start the processor
if (require.main === module) {
  const processor = new NotificationProcessor();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await processor.stopProcessing();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await processor.stopProcessing();
    process.exit(0);
  });
  
  // Start processing
  processor.startProcessing().catch(console.error);
}
