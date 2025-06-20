
import { Notification, NotificationToken } from '../model/DBModel.js';
import admin from './firebase-admin.js';

const defaultConfig = {
  enableLogging: true,                   // Enable console logs
  cleanupInvalidTokens: true,            // Auto-remove invalid tokens
  defaultIcon: '/images/auction-icon.png', // Default notification icon
  trackHistory: true,                    // Track notification history
  maxHistorySize: 100                    // Maximum history entries to keep
};

function createNotificationService(config = {}) { 
  // Merge provided config with defaults
  const serviceConfig = { ...defaultConfig, ...config };
  
  function log(message, level = 'log') {
    if (serviceConfig.enableLogging) {
      console[level](`[AuctionNotifier] ${message}`);
    }
  }

  function getLinkForType(type, options) {
    switch (type) {
        case 'new_user':
        return `/user-detail/${options.userId}`;
        case 'auction_created':
        return `/auctions/${options.auctionId}`;
        case 'auction_won':
        return `/auctions/${options.auctionId}`;
        default:
        return '/dashboard'; // fallback
    }
}


  async function sendNotification(receiver, message, type, options = {}) {
    try {
        log(`Sending ${type} notification to ${receiver}: ${message}`);
        
        // Create the notification payload with BOTH notification and data fields
        const payload = {
                data: { 
                    n_title: getDefaultTitleForType(type) || "Auction Notification",
                    n_body: message,
                    type : type,
                    link: getLinkForType(type, options)
                }
            };
           

        // Initialize results tracking
        const results = {
        success: 0,
        failed: 0,
        invalidTokensRemoved: 0,
        errors: []
        };

        // Track notification in history if enabled
        if (serviceConfig.trackHistory) {
        await Notification.create({
            receiver: typeof receiver === 'string' ? receiver : receiver.join(','),
            message,
            type,
            // options: JSON.stringify(options),
            timestamp: new Date()
        });
        
        // Clean up old notifications if needed
        if (serviceConfig.maxHistorySize > 0) {
            const count = await Notification.countDocuments();
            if (count > serviceConfig.maxHistorySize) {
            const notificationsToDelete = count - serviceConfig.maxHistorySize;
            const oldestNotifications = await Notification
                .find({})
                .sort({ timestamp: 1 })
                .limit(notificationsToDelete);
                
            if (oldestNotifications.length > 0) {
                await Notification.deleteMany({
                _id: { $in: oldestNotifications.map(n => n._id) }
                });
            }
            }
        }
        }

        // CASE 1: Send to all users
        if (receiver === 'all') {
            const allTokens = await NotificationToken.find({ role: 'user' });
            log(`Sending to ${allTokens.length} users`);
            
            const validTokens = [];
            const invalidTokens = [];
            
            // Collect valid tokens
            const tokens = [];
            const tokenIdMap = {}; // Map token => tokenDoc._id

            for (const tokenDoc of allTokens) {
                const token = tokenDoc.token;
                if (token && token.trim() !== '') {
                    tokens.push(token);
                    tokenIdMap[token] = tokenDoc._id;
                }
            }

            if (tokens.length === 0) {
                log('No valid tokens to send to.');
                return results;
            }

            // Create a multicast message
            const multicastMessage = {
                tokens,
                data: payload.data
            };

            console.log("📤 Sending multicast payload:", JSON.stringify(multicastMessage, null, 2));

            try {
                const response = await admin.messaging().sendEachForMulticast(multicastMessage);

                console.log('✅ Multicast response:', response);

                const invalidTokens = [];

                response.responses.forEach((res, index) => {
                    const token = tokens[index];
                    if (res.success) {
                        results.success++;
                        validTokens.push(tokenIdMap[token]);
                    } else {
                        results.failed++;
                        log(`❌ Error sending to token ${token.substring(0, 10)}... - ${res.error.message} (${res.error.code})`, 'error');
                        results.errors.push({
                            token: token.substring(0, 10) + '...',
                            error: res.error.message,
                            code: res.error.code
                        });

                        if (
                            serviceConfig.cleanupInvalidTokens &&
                            (res.error.code === 'messaging/invalid-registration-token' ||
                            res.error.code === 'messaging/registration-token-not-registered')
                        ) {
                            invalidTokens.push(tokenIdMap[token]);
                        }
                    }
                });

                if (invalidTokens.length > 0) {
                    log(`🧹 Removing ${invalidTokens.length} invalid tokens`);
                    await NotificationToken.deleteMany({ _id: { $in: invalidTokens } });
                    results.invalidTokensRemoved = invalidTokens.length;
                }

            } catch (err) {
                log('❌ Failed to send multicast:', 'error');
                log(err.message, 'error');
                results.failed = tokens.length; 
                results.errors.push({ error: err.message });
            }


        
        // Remove invalid tokens if any
        if (invalidTokens.length > 0) {
            log(`Removing ${invalidTokens.length} invalid tokens`);
            await NotificationToken.deleteMany({ _id: { $in: invalidTokens } });
            results.invalidTokensRemoved = invalidTokens.length;
        }
        } 
        // CASE 2: Send to admin
        else if (receiver === 'admin') {
            const adminTokens = await NotificationToken.find({ role: 'admin' });

            if (adminTokens.length === 0) {
                log('No admin tokens found, notification not sent', 'warn');
                results.errors.push({ error: 'No admin tokens found' });
                return results;
            }

            log(`Sending to ${adminTokens.length} admins`);

            const invalidTokens = [];

            for (const tokenDoc of adminTokens) {
                const token = tokenDoc.token;
                if (!token || token.trim() === '') continue;

                try {
                const response = await admin.messaging().send({
                    token: token,
                    data: {
                        n_title: payload.data.n_title, // data-only payload
                        n_body: payload.data.n_body,
                        type: payload.data.type,
                        link: getLinkForType(type, options)
                    }
                });

                console.log('Successfully sent message:', response);
                results.success++;
                } catch (error) {
                log('Error sending notification to admin: ' + error.message, 'error');
                results.failed++;
                results.errors.push({
                    error: error.message,
                    code: error.code
                });

                if (
                    serviceConfig.cleanupInvalidTokens &&
                    (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered')
                ) {
                    invalidTokens.push(tokenDoc._id);
                }
                }
            }

            if (invalidTokens.length > 0) {
                log(`Removing ${invalidTokens.length} invalid admin tokens`);
                await NotificationToken.deleteMany({ _id: { $in: invalidTokens } });
                results.invalidTokensRemoved = invalidTokens.length;
            }
        }

        // CASE 3: Send to specific users by ID
        else if ((Array.isArray(receiver) && receiver.length > 0) ||
            (typeof receiver === 'string' && receiver !== 'all' && receiver !== 'admin')
            ) {
            const userIds = Array.isArray(receiver) ? receiver : [receiver];
            const userTokens = await NotificationToken.find({ userId: { $in: userIds } });

            log(`Sending to ${userTokens.length} specific users`);

            if (userTokens.length === 0) {
                log(`No tokens found for specified users`, 'warn');
                results.errors.push({ error: 'No tokens found for specified users' });
                return results;
            }

            const invalidTokens = [];

            for (const tokenDoc of userTokens) {
                const token = tokenDoc.token;
                if (!token || token.trim() === '') continue;

                try {
                const response = await admin.messaging().send({
                    token: token,
                    data: {
                        n_title: payload.data.n_title,
                        n_body: payload.data.n_body,
                        type: payload.data.type,
                        link: getLinkForType(type, options)
                    }
                });

                console.log('Successfully sent message:', response);
                results.success++;
                } catch (error) {
                results.failed++;
                results.errors.push({
                    token: token.substring(0, 10) + '...',
                    error: error.message,
                    code: error.code
                });

                if (
                    serviceConfig.cleanupInvalidTokens &&
                    (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered')
                ) {
                    invalidTokens.push(tokenDoc._id);
                }
                }
            }

            if (invalidTokens.length > 0) {
                log(`Removing ${invalidTokens.length} invalid user tokens`);
                await NotificationToken.deleteMany({ _id: { $in: invalidTokens } });
                results.invalidTokensRemoved = invalidTokens.length;
            }
        }

        else {
        log(`No valid receiver specified`, 'warn');
        results.errors.push({ error: `No valid receiver specified` });
        }
        
        return results;
    } catch (error) {
        log('Error in sendNotification: ' + error.message, 'error');
        return {
            success: 0,
            failed: 1,
            invalidTokensRemoved: 0,
            errors: [{ error: error.message }]
        };
    }
 }


  function getDefaultTitleForType(type) {
    const titles = {
      'auction_created': 'New Auction Available',
      'auction_updated': "Auction Has being Updated",
      'auction_started': 'Auction Has Started',
      'auction_ending_soon': 'Auction Ending Soon',
      'auction_ended': 'Auction Has Ended',
      'bid_placed': 'New Bid Placed',
      'outbid': 'You Have Been Outbid',
      'auction_won': 'You Won the Auction',
      'kyc_approved': 'KYC Verification Approved',
      'kyc_rejected': 'KYC Verification Rejected',
      'payment_received': 'Payment Received',
      'emd_refunded': 'EMD Amount Refunded',
      'new_user': 'New User Registration',
      'test': 'Test Notification'
    };
    
    return titles[type] || 'Auction Notification';
  }

 
  async function registerToken(token, role, userId = null) {
    console.log(`In RegisterToken: ROLE: ${role}, USERID: ${userId}`);
    try {
      if (!token || token.trim() === '') {
        log('Empty token provided, not registering', 'warn');
        return false;
      }

      // Check if token already exists
      const existingToken = await NotificationToken.findOne({ token });
      
      if (existingToken) {
        // Update existing token if needed
        if (existingToken.role !== role || 
           (userId && existingToken.userId?.toString() !== userId.toString())) {
          existingToken.role = role;
          if (userId) existingToken.userId = userId;
          await existingToken.save();
          log('Token updated with new role/userId');
        } else {
          log('Token already registered with same details');
        }
      } else {
        // Create new token record
        await NotificationToken.create({
          token,
          role,
          userId,
          createdAt: new Date()
        });
        log(`New ${role} token registered for user ${userId}`);
      }
      
      return true;
    } catch (error) {
      log('Error registering token: ' + error.message, 'error');
      return false;
    }
  }

 
  async function getNotificationHistory(limit = 50) {
    try {
      const notifications = await Notification
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit);
        
      return notifications;
    } catch (error) {
      log('Error getting notification history: ' + error.message, 'error');
      return [];
    }
  }


  async function clearInvalidTokens() {
    try {
      const allTokens = await NotificationToken.find({});
      let removedCount = 0;
      
      for (const tokenDoc of allTokens) {
        try {
          // Try sending a silent notification to validate the token
          await admin.messaging().send({
            token: tokenDoc.token,
            data: { type: 'validation' }
          });
        } catch (error) {
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            await NotificationToken.findByIdAndDelete(tokenDoc._id);
            removedCount++;
          }
        }
      }
      
      log(`Cleared ${removedCount} invalid tokens`);
      return { removed: removedCount };
    } catch (error) {
      log('Error clearing invalid tokens: ' + error.message, 'error');
      return { removed: 0, error: error.message };
    }
  }

  // Return the public API
  return {
    sendNotification,
    registerToken,
    getNotificationHistory,
    clearInvalidTokens
  };
}

export  default  createNotificationService;
