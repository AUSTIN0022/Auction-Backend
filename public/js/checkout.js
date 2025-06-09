
import createNotificationService from '../../utils/noticationService.js';


const notificationService = createNotificationService();


/**
 * Initiates the payment process with Razorpay
 * @param {Object} paymentData - Payment details
 * @param {number} paymentData.amount - Amount to be paid
 * @param {string} paymentData.paymentType - Type of payment ('emd' or 'final')
 * @param {string} paymentData.auctionId - ID of the auction
 * @param {string} paymentData.description - Description of the payment
 */
async function initiatePayment(paymentData) {
    console.log(`In checkout.js PaymentData: ${paymentData}`);
    try {
      // Show loading state
      document.getElementById('payment-loader').style.display = 'block';
      
      // Create payment order on server
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create payment');
      }
      
      // Configure Razorpay options
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Auction Platform",
        description: paymentData.description || "Auction Payment",
        order_id: data.order.id,
        prefill: {
          name: data.user.name,
          email: data.user.email,
          contact: data.user.mobile
        },
        notes: {
          paymentId: data.payment.id,
          auctionId: paymentData.auctionId,
          paymentType: paymentData.paymentType
        },
        theme: {
          color: "#3399cc"
        },
        modal: {
          ondismiss: function() {
            // Handle payment modal dismissal
            document.getElementById('payment-loader').style.display = 'none';
            document.getElementById('payment-status').innerText = 'Payment cancelled';
            document.getElementById('payment-status').classList.add('error');
            
            // Optionally cancel the payment in the backend
            cancelPayment(data.payment.id);
          }
        },
        handler: function(response) {
          // Handle successful payment
          verifyPayment(response, data.payment.id);
        }
      };
      
      // Initialize Razorpay
      const razorpay = new Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      document.getElementById('payment-loader').style.display = 'none';
      document.getElementById('payment-status').innerText = `Payment Error: ${error.message}`;
      document.getElementById('payment-status').classList.add('error');
    }
  }
  
  // Verify payment with backend after Razorpay callback
  async function verifyPayment(response, paymentId) {

    const userId = req.user._id;

    console.log(`Response: ${response}, paymentId: ${paymentId}`);
    try {
      // Show verifying state
      document.getElementById('payment-status').innerText = 'Verifying payment...';
      
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          paymentId: paymentId
        })
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        
         await notificationService.sendNotification(
            userId,
            `Verifying payment successfully`,
            'payment_received',
        );
        // Payment successful
        document.getElementById('payment-loader').style.display = 'none';
        document.getElementById('payment-status').innerText = 'Payment successful!';
        document.getElementById('payment-status').classList.remove('error');
        document.getElementById('payment-status').classList.add('success');
        
        // Redirect to success page after a short delay
        setTimeout(() => {
          window.location.href = verifyData.redirectUrl || '/payment-success';
        }, 1000);
      } else {
        // Payment verification failed
        document.getElementById('payment-loader').style.display = 'none';
        document.getElementById('payment-status').innerText = `Payment verification failed: ${verifyData.message}`;
        document.getElementById('payment-status').classList.add('error');
        
        // Redirect to failure page if provided
        if (verifyData.redirectUrl) {
          setTimeout(() => {
            window.location.href = verifyData.redirectUrl;
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      document.getElementById('payment-loader').style.display = 'none';
      document.getElementById('payment-status').innerText = `Verification Error: ${error.message}`;
      document.getElementById('payment-status').classList.add('error');
    }
  }
  
  // Cancel a pending payment
  async function cancelPayment(paymentId) {
    try {
      await fetch(`/api/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // No need to handle response as this is just cleanup
    } catch (error) {
      console.error('Error cancelling payment:', error);
    }
  }
  
  // Example usage for registering for an auction (EMD payment)
  function registerForAuction(auctionId, emdAmount) {
    const paymentData = {
      amount: emdAmount,
      paymentType: 'emd',
      auctionId: auctionId,
      description: 'EMD Payment',
      redirectSuccess: `/auctions/${auctionId}/registration-success`,
      redirectFailure: `/auctions/${auctionId}/registration-failure`
    };
    
    initiatePayment(paymentData);
  }
  
  // Example usage for making final payment after winning auction
  function payAuction(auctionId, finalAmount) {
    const paymentData = {
      amount: finalAmount,
      paymentType: 'final',
      auctionId: auctionId,
      description: 'Final Payment',
      redirectSuccess: `/auctions/${auctionId}/purchase-success`,
      redirectFailure: `/auctions/${auctionId}/purchase-failure`
    };
    
    initiatePayment(paymentData);
  }

