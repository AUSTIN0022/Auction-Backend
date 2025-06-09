
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAGH_yE_Fo7Yyj99cBUBB6Hol5gk_jZ40g",
    authDomain: "auction-3b256.firebaseapp.com",
    projectId: "auction-3b256",
    storageBucket: "auction-3b256.firebasestorage.app",
    messagingSenderId: "165002779847",
    appId: "1:165002779847:web:e0dc73b92f92a70517b2e2",
    measurementId: "G-KB9XW55DXN"
};

class AuctionNotifications {
  constructor() {
    this.firebase = null;
    this.messaging = null;
    this.token = null;
    this.isInitialized = false;
    this.notificationQueue = [];
    this.toastContainer = null;
    this.userId = null;
    this.userRole = 'user'; // Default role
    this.swRegistration = null;
  }

  async initialize(options = {}) {
    try {
      // Skip if already initialized
      if (this.isInitialized) return true;

      console.log('[Auction Notifications] Initializing...');
      
      console.log(`OPTIONS: userId ${options.userId} Role: ${options.role}`);
      // Set user information if provided
      if (options.userId) this.userId = options.userId;
      if (options.role) this.userRole = options.role;

      console.log(`After OPTIONS: userId ${this.userId} Role: ${this.userRole}`);

      // Import Firebase from CDN if not already available
      if (!window.firebase) {
        console.log('[Auction Notifications] Loading Firebase from CDN...');
        await this.loadFirebaseScripts();
      }

      // Initialize Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      
      this.firebase = firebase;
      
      console.log(`Before if(this.isMessagingSupported)`);
      // Initialize messaging if supported
      if (this.isMessagingSupported()) {
        this.messaging = firebase.messaging();
        console.log(`✅ this.messaging is enabled`);
        
        // Create toast container FIRST
        this.createToastContainer();
        
        await this.registerServiceWorker();
        
        await this.requestPermissionAndRegisterToken();
        
        console.log(`🔥 Setting up onMessage handler with proper SW registration...`);
        this.setupMessageHandlers();
        
        this.isInitialized = true;
        
        this.processNotificationQueue();
        
        console.log('✅ [Auction Notifications] Initialization complete');
        return true;
      } else {
        console.warn('[Auction Notifications] Firebase messaging is not supported in this browser');
        return false;
      }
    } catch (error) {
      console.error('[Auction Notifications] Initialization error:', error);
      return false;
    }
  }

  async registerServiceWorker() {
    try {
      console.log('🔧 [SW] Registering service worker...');
      
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.scope.includes('firebase-messaging-sw')) {
          console.log('🔧 [SW] Unregistering old SW:', registration.scope);
          await registration.unregister();
        }
      }
      
      // Register the service worker
      this.swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      
      console.log('✅ [SW] Service Worker registered:', this.swRegistration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ [SW] Service Worker is ready');
      
      return this.swRegistration;
    } catch (error) {
      console.error('❌ [SW] Service Worker registration failed:', error);
      throw error;
    }
  }

  setupMessageHandlers() {
    if (!this.messaging) {
      console.error('❌ [FCM] Messaging not initialized');
      return;
    }

    console.log('🔥 [FCM] Setting up message handlers...');
    
    // Set up foreground message handler with explicit logging
    this.messaging.onMessage((payload) => {
      console.log('🔥🔥🔥 [FCM] FOREGROUND MESSAGE RECEIVED!');
      console.log('🔥 [FCM] Full payload:', JSON.stringify(payload, null, 2));
      console.log('🔥 [FCM] Data:', payload.data);

       const reconstructed = {
            data: {
                title: payload.data?.n_title || 'Auction Notification',
                body: payload.data?.n_body || '',
                type: payload.data.type,
                auctionId: payload.data?.auctionId || ''
            },
        };
        console.log(`Reconstructed payload: ${JSON.stringify(reconstructed, null, 2)}`);
      try {
        this.displayNotification(reconstructed);
        console.log('✅ [FCM] Successfully processed foreground notification');
      } catch (error) {
        console.error('❌ [FCM] Error displaying notification:', error);
      }
    });
    
    
   
    
    console.log('✅ [FCM] Message handlers registered');
  }

  isMessagingSupported() {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           firebase && 
           firebase.messaging && 
           typeof firebase.messaging === 'function';
  }

  loadFirebaseScripts() {
    return new Promise((resolve, reject) => {
      const scripts = [
        { src: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js', id: 'firebase-app' },
        { src: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js', id: 'firebase-messaging' }
      ];
      
      let loadedCount = 0;
      
      scripts.forEach(script => {
        // Skip if already loaded
        if (document.getElementById(script.id)) {
          loadedCount++;
          if (loadedCount === scripts.length) resolve();
          return;
        }
        
        const scriptElement = document.createElement('script');
        scriptElement.src = script.src;
        scriptElement.id = script.id;
        
        scriptElement.onload = () => {
          loadedCount++;
          if (loadedCount === scripts.length) resolve();
        };
        
        scriptElement.onerror = (error) => {
          reject(new Error(`Failed to load ${script.src}: ${error}`));
        };
        
        document.head.appendChild(scriptElement);
      });
    });
  }


  async requestPermissionAndRegisterToken() {
    try {
      // Check current permission status
      console.log('🔐 [PERMISSION] Current permission:', Notification.permission);
      
      // Request permission
      const permission = await Notification.requestPermission();
      console.log('🔐 [PERMISSION] Permission result:', permission);
      
      if (permission === 'granted') {
        console.log('[Auction Notifications] Notification permission granted');
        
        // Get registration token
        await this.getTokenAndRegister();
        return true;
      } else {
        console.warn('[Auction Notifications] Permission not granted:', permission);
        return false;
      }
    } catch (error) {
      console.error('[Auction Notifications] Permission request error:', error);
      return false;
    }
  }

  async getTokenAndRegister() {
    try {
      if (!this.messaging || !this.swRegistration) {
        console.error('❌ [TOKEN] Messaging or SW registration not available');
        return null;
      }
      
      console.log('🎟️ [TOKEN] Getting FCM token with SW registration...');
      
      // Get messaging token with the service worker registration
      const token = await this.messaging.getToken({
        vapidKey: 'BO-xbv_VZHICsdwVIpzEcTQ-ChtlP8KqsVA1b7qqMd6TCfP6FqiNU1g1YZPfkSCwhk8QNdmAil5IDMN4BQAIb_8', 
        serviceWorkerRegistration: this.swRegistration
      });
      
      if (token) {
        console.log('✅ [TOKEN] Token received:', token.substring(0, 20) + '...');
        this.token = token;
        
        // Register token with server
        await this.registerTokenWithServer(token);
        return token;
      } else {
        console.warn('❌ [TOKEN] No token received');
        return null;
      }
    } catch (error) {
      console.error('❌ [TOKEN] Token error:', error);
      return null;
    }
  }

  async registerTokenWithServer(token) {
      const lastToken = localStorage.getItem('fcmToken');
      const lastUserId = localStorage.getItem('fcmUserId');
      
      // Skip re-register if same token and same user already sent
      if (lastToken === token && lastUserId === this.userId) {
          console.log('[Auction Notifications] Token already registered with same userId, skipping...');
          return true;
      }

      try {
          console.log(`🔄 [REGISTER] RegisterTokenWithServer: userID: ${this.userId} Role: ${this.userRole}`);

          const response = await fetch('/api/register-token', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              token,
              role: this.userRole,
              userId: this.userId
          })
          });

          const data = await response.json();

          if (data.success) {
            localStorage.setItem('fcmToken', token);
            localStorage.setItem('fcmUserId', this.userId);
            console.log('✅ [REGISTER] Token registered with server');
            return true;
          } else {
            console.warn('❌ [REGISTER] Token registration failed:', data.error);
            return false;
          }
      } catch (error) {
          console.error('❌ [REGISTER] Token registration error:', error);
          return false;
      }
  }

  // Create toast container for showing notifications
  createToastContainer() {
    // Skip if already created
    console.log(`🎨 [UI] Creating toast container...`);
    if (this.toastContainer) {
      console.log('🎨 [UI] Toast container already exists');
      return;
    }
    
    // Create container
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'auction-notification-container';
    document.body.appendChild(this.toastContainer);
    
    // Add styles if not already present
    if (!document.getElementById('auction-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'auction-notification-styles';
      style.textContent = `
        .auction-notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          max-width: 350px;
        }
        
        .auction-notification {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          margin-bottom: 10px;
          padding: 15px;
          transform: translateX(120%);
          transition: transform 0.3s ease-out;
          border-left: 4px solid #3498db;
          display: flex;
          align-items: flex-start;
          position: relative;
        }
        
        .auction-notification.show {
          transform: translateX(0);
        }
        
        .auction-notification .icon {
          flex-shrink: 0;
          margin-right: 12px;
          width: 24px;
          height: 24px;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          background-color: #f0f0f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .auction-notification .content {
          flex-grow: 1;
        }
        
        .auction-notification .title {
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
          font-size: 14px;
        }
        
        .auction-notification .message {
          color: #555;
          margin-bottom: 10px;
          font-size: 13px;
          line-height: 1.4;
        }
        
        .auction-notification .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .auction-notification .action-btn {
          padding: 6px 12px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 12px;
          background-color: #f1f1f1;
          color: #333;
          transition: background-color 0.2s;
        }
        
        .auction-notification .action-btn:hover {
          background-color: #e1e1e1;
        }
        
        .auction-notification .action-btn.primary {
          background-color: #3498db;
          color: white;
        }
        
        .auction-notification .action-btn.primary:hover {
          background-color: #2980b9;
        }
        
        .auction-notification .close {
          cursor: pointer;
          position: absolute;
          top: 8px;
          right: 8px;
          color: #aaa;
          font-size: 18px;
          font-weight: bold;
          line-height: 1;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }
        
        .auction-notification .close:hover {
          background-color: #f0f0f0;
          color: #333;
        }
        
        /* Notification types */
        .auction-notification.auction_created { border-left-color: #2ecc71; }
        .auction-notification.auction_started { border-left-color: #3498db; }
        .auction-notification.auction_ending_soon { border-left-color: #f39c12; }
        .auction-notification.auction_ended { border-left-color: #95a5a6; }
        .auction-notification.bid_placed { border-left-color: #9b59b6; }
        .auction-notification.outbid { border-left-color: #e74c3c; }
        .auction-notification.auction_won { border-left-color: #f1c40f; }
        .auction-notification.kyc_approved { border-left-color: #27ae60; }
        .auction-notification.kyc_rejected { border-left-color: #c0392b; }
        
        /* Animation keyframes */
        @keyframes slideIn {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(120%);
            opacity: 0;
          }
        }
        
        .auction-notification.slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        
        .auction-notification.slide-out {
          animation: slideOut 0.3s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }
    
    console.log('✅ [UI] Toast container and styles created');
  }

  processNotificationQueue() {
    if (this.notificationQueue.length > 0) {
      console.log(`🔄 [QUEUE] Processing ${this.notificationQueue.length} queued notifications`);
      
      this.notificationQueue.forEach(notification => {
        this.displayNotification(notification);
      });
      
      this.notificationQueue = [];
    }
  }

  // Display a notification as a toast
  displayNotification(payload) {
    console.log('🎯 [DISPLAY] displayNotification called with:', payload);
    console.log('🎯 [DISPLAY] isInitialized:', this.isInitialized);
    console.log('🎯 [DISPLAY] toastContainer exists:', !!this.toastContainer);

    // If not initialized, queue the notification
    if (!this.isInitialized || !this.toastContainer) {
        console.log('⏳ [DISPLAY] Not initialized, queuing notification');
        this.notificationQueue.push(payload);
        return;
    }
    
    // Extract notification data
    const title = payload.data?.title || 'Auction Notification';
    const message = payload.data?.body || '';
    const type = payload.data?.type || 'general';
    const auctionId = payload.data?.auctionId || '';
    
    console.log(`🎯 [DISPLAY] Processing: title="${title}", message="${message}", type="${type}", auctionId="${auctionId}"`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `auction-notification ${type}`;
    
    // Create HTML structure
    notification.innerHTML = `
      <div class="content">
        <div class="title">${this.escapeHTML(title)}</div>
        <div class="message">${this.escapeHTML(message)}</div>
        <div class="actions">
          ${this.getActionButtonsHTML(type, auctionId)}
        </div>
      </div>
      <span class="close">&times;</span>
    `;
    
    // Add close button event listener
    const closeBtn = notification.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.removeNotification(notification);
      });
    }
    
    // Add action button event listeners
    const actionButtons = notification.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const action = event.target.dataset.action;
        const id = event.target.dataset.id;
        
        this.handleActionClick(action, id);
        this.removeNotification(notification);
      });
    });
    
    // Add to container
    this.toastContainer.appendChild(notification);
    console.log('✅ [DISPLAY] Notification added to container');
    
    // Trigger animation after a small delay to ensure DOM is ready
    requestAnimationFrame(() => {
      notification.classList.add('show');
      console.log('✅ [DISPLAY] Animation triggered');
    });
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      this.removeNotification(notification);
    }, 8000);
  }

  getActionButtonsHTML(type, auctionId) {
    if (!auctionId) return '';
    
    switch (type) {
      case 'auction_created':
      case 'auction_started':
        return `
          <button class="action-btn primary" data-action="view-auction" data-id="${auctionId}">View Auction</button>
        `;
      
      case 'auction_ending_soon':
        return `
          <button class="action-btn primary" data-action="place-bid" data-id="${auctionId}">Place Bid</button>
          <button class="action-btn" data-action="view-auction" data-id="${auctionId}">View Details</button>
        `;
      
      case 'outbid':
        return `
          <button class="action-btn primary" data-action="place-bid" data-id="${auctionId}">Place New Bid</button>
        `;
      
      case 'auction_won':
        return `
          <button class="action-btn primary" data-action="payment" data-id="${auctionId}">Complete Payment</button>
          <button class="action-btn" data-action="view-result" data-id="${auctionId}">View Details</button>
        `;
      
      case 'bid_placed':
        return `
          <button class="action-btn" data-action="view-auction" data-id="${auctionId}">View Auction</button>
        `;
      
      case 'auction_ended':
        return `
          <button class="action-btn" data-action="view-result" data-id="${auctionId}">View Result</button>
        `;
        
      default:
        return '';
    }
  }

  handleActionClick(action, id) {
    if (!id) return;
    
    let url = '/';
    
    switch (action) {
      case 'view-auction':
        url = `/auctions/${id}`;
        break;
      
      case 'place-bid':
        url = `/auction/${id}#bid-section`;
        break;
      
      case 'view-result':
        url = `/auction/${id}/result`;
        break;
      
      case 'payment':
        url = `/payment/${id}`;
        break;
    }
    
    window.location.href = url;
  }

  removeNotification(notification) {
    if (!notification || !notification.parentNode) return;
    
    notification.classList.remove('show');
    notification.classList.add('slide-out');
    
    // Wait for animation to complete before removing
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 500);
  }

  async sendTestNotification(type = 'test') {
    try {
      console.log(`[Auction Notifications] Sending test notification of type: ${type}`);
      
      // Simulate a notification payload
      const payload = {
        notification: {
          title: 'Test Notification',
          body: `This is a test ${type} notification to verify the system is working properly.`
        },
        data: {
          type: type,
          auctionId: '123456789'
        }
      };
      
      this.displayNotification(payload);
    } catch (error) {
      console.error('[Auction Notifications] Test notification error:', error);
    }
  }

  escapeHTML(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Create and export singleton instance
const auctionNotifications = new AuctionNotifications();

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Get user info from data attributes if available
  const userInfoElement = document.getElementById('user-info');
  let userId = null;
  let userRole = 'user';
  
  if (userInfoElement) {
    userId = userInfoElement.dataset.userId;
    userRole = userInfoElement.dataset.userRole || 'user';
  }
  
  console.log(`[Auction Notifications] DOM ready - User ID: ${userId}, Role: ${userRole}`);
  
  // Initialize notifications
  auctionNotifications.initialize({
    userId,
    role: userRole
  }).then(success => {
    if (success) {
      console.log('✅ [INIT] Ready to receive notifications');
      
      // Add debugging tools in development
      if (window.location.search.includes('debug=notifications')) {
        setTimeout(() => {
          // Test button
          const testBtn = document.createElement('button');
          testBtn.textContent = 'Test Notification';
          testBtn.style.cssText = 'position:fixed;top:10px;left:10px;z-index:10000;padding:10px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;';
          testBtn.onclick = () => auctionNotifications.sendTestNotification('auction_created');
          document.body.appendChild(testBtn);
          
          // Debug button
          const debugBtn = document.createElement('button');
          debugBtn.textContent = 'Debug Handler';
          debugBtn.style.cssText = 'position:fixed;top:50px;left:10px;z-index:10000;padding:10px;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;';
          debugBtn.onclick = () => auctionNotifications.debugMessageHandler();
          document.body.appendChild(debugBtn);
        }, 1000);
      }
    }
  });
});

// Export for global use
window.auctionNotifications = auctionNotifications;