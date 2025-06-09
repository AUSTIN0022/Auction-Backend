
module.exports = {
    // Razorpay API keys (should be loaded from environment variables in production)
    keyId: process.env.RAZORPAY_API_ID || 'your_razorpay_key_id',
    keySecret: process.env.RAZORPAY_API_SECRET || 'your_razorpay_key_secret',
    
    // Webhook secret for verifying Razorpay callbacks
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret',
    
    // Default currency
    currency: 'INR',
    
    // Receipt prefix for order identifiers
    receiptPrefix: 'order_rcpt_',
    
    // Name to be displayed on payment page
    displayName: 'Auction Platform',
    
    // Default theme color for payment page
    themeColor: '#3399cc',
    
    // API endpoints to be used for redirects
    endpoints: {
      createPayment: '/api/payments/create',
      verifyPayment: '/api/payments/verify',
      webhook: '/api/payments/webhook',
      success: '/payment-success.html',
      failure: '/payment-failure.html'
    }
  };