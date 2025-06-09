

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase configuration - Update with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAGH_yE_Fo7Yyj99cBUBB6Hol5gk_jZ40g",
    authDomain: "auction-3b256.firebaseapp.com",
    projectId: "auction-3b256",
    storageBucket: "auction-3b256.firebasestorage.app",
    messagingSenderId: "165002779847",
    appId: "1:165002779847:web:e0dc73b92f92a70517b2e2",
    measurementId: "G-KB9XW55DXN"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages with improved notification appearance
messaging.onBackgroundMessage((payload) => {
  console.log('[Auction SW] Background message received:', payload);
  
  // Extract notification data
  const notificationTitle = payload.notification.title || 'New Auction Notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    data: payload.data || {},
    vibrate: [100, 50, 100], // Custom vibration pattern
    tag: payload.data?.type || 'general', // Group notifications by type
    timestamp: Date.now(), // Add timestamp
    requireInteraction: ['auction_ending_soon', 'outbid', 'auction_won'].includes(payload.data?.type) // Require interaction for important notifications
  };
  
  // Add action buttons based on notification type
  if (payload.data?.type && payload.data?.auctionId) {
    switch(payload.data.type) {
      case 'auction_started':
      case 'auction_ending_soon':
        notificationOptions.actions = [
          {
            action: 'view_auction',
            title: 'View Auction',
          },
          {
            action: 'place_bid',
            title: 'Place Bid',
          }
        ];
        break;
        
      case 'outbid':
        notificationOptions.actions = [
          {
            action: 'place_bid',
            title: 'Place New Bid',
          }
        ];
        break;
        
      case 'auction_won':
        notificationOptions.actions = [
          {
            action: 'view_details',
            title: 'View Details',
          },
          {
            action: 'payment',
            title: 'Complete Payment',
          }
        ];
        break;
        
      case 'auction_created':
        notificationOptions.actions = [
          {
            action: 'view_auction',
            title: 'View Auction',
          }
        ];
        break;
    }
  }
  
  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Auction SW] Notification click received:', event);
  
  const notification = event.notification;
  const action = event.action;
  const notificationData = notification.data;
  
  // Close the notification
  notification.close();
  
  // Default URL to open is the homepage
  let targetUrl = '/';
  
  // Process different notification actions
  if (action === 'view_auction' && notificationData.auctionId) {
    targetUrl = `/auction/${notificationData.auctionId}`;
  }
  else if (action === 'place_bid' && notificationData.auctionId) {
    targetUrl = `/auction/${notificationData.auctionId}#bid-section`;
  }
  else if (action === 'view_details' && notificationData.auctionId) {
    targetUrl = `/auction/${notificationData.auctionId}/details`;
  }
  else if (action === 'payment' && notificationData.auctionId) {
    targetUrl = `/payment/${notificationData.auctionId}`;
  }
  // If no action was clicked, determine target URL based on notification type
  else if (notificationData.type) {
    switch(notificationData.type) {
      case 'auction_created':
      case 'auction_started':
        targetUrl = notificationData.auctionId ? `/auction/${notificationData.auctionId}` : '/auctions';
        break;
        
      case 'auction_ended':
      case 'auction_won':
        targetUrl = notificationData.auctionId ? `/auction/${notificationData.auctionId}/result` : '/dashboard';
        break;
        
      case 'bid_placed':
      case 'outbid':
        targetUrl = notificationData.auctionId ? `/auction/${notificationData.auctionId}` : '/dashboard/bidding';
        break;
        
      case 'kyc_approved':
      case 'kyc_rejected':
        targetUrl = '/dashboard/profile';
        break;
        
      case 'payment_received':
      case 'emd_refunded':
        targetUrl = '/dashboard/wallet';
        break;
        
      default:
        targetUrl = '/dashboard';
    }
  }
  
  // Open or focus window
  event.waitUntil(
    clients.matchAll({
      type: "window"
    })
    .then((clientList) => {
      // Try to find an existing window/tab to focus
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});