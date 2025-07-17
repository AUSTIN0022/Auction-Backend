
import dotenv from 'dotenv';
dotenv.config();

import { createHmac } from 'crypto';
import Razorpay from 'razorpay';
import { Auction, Payment, User } from '../model/DBModel.js';

// Initialize Razorpay with your key_id and key_secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_ID,
  key_secret: process.env.RAZORPAY_API_SECRET
});

console.log('=== ENVIRONMENT DEBUG ===');
console.log('RAZORPAY_API_ID:', process.env.RAZORPAY_API_ID);
console.log('RAZORPAY_API_SECRET:', process.env.RAZORPAY_API_SECRET);
console.log('Keys present:', {
    id: !!process.env.RAZORPAY_API_ID,
    secret: !!process.env.RAZORPAY_API_SECRET
});
console.log('========================');

export const createPayment = async (req, res) => {
    console.log(`Backend createPayemt: ${JSON.stringify(req.body)}`);
  try {
    const { 
      amount, 
      paymentType, 
      auctionId, 
      currency = 'INR', 
      description = 'Auction Payment',
      redirectSuccess,
      redirectFailure 
    } = req.body;

    const userId = req.user._id; // Assuming user is authenticated
    
    // Validate required fields
    if (!amount || !paymentType || !auctionId) {
      return res.status(400).json({
        success: false,
        message: 'Amount, paymentType and auctionId are required'
      });
    }

    // Ensure amount is valid (Razorpay expects amount in paise)
    const amountInPaise = Math.round(amount * 100);
    
    // Get user de~tails for prefill
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get auction details
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Validate payment type and auction status
    if (paymentType === 'emd') {
      // Check if registration deadline has passed
      if (new Date() > new Date(auction.registrationDeadline)) {
        return res.status(400).json({
          success: false,
          message: 'Registration deadline has passed'
        });
      }
      
      // Check if user is already registered for the auction
      if (auction.bidders.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You are already registered for this auction'
        });
      }
    } else if (paymentType === 'final') {
      // Check if the user is the winner
      if (!auction.winner || auction.winner.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the auction winner can make the final payment'
        });
      }
      
      // Check if auction is completed
      if (auction.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Auction is not yet completed'
        });
      }
    }

    const shortId = userId.toString().slice(0, 8); 
    console.log(`shortID: ${shortId}`);
    // Create order options
    const options = {
      amount: amountInPaise,
      currency,
      receipt: `receipt_${Date.now()}_${shortId}`,
      notes: {
        userId: userId.toString(),
        auctionId: auctionId.toString(),
        paymentType,
        description
      }
    };

    // Create order in Razorpay
    const order = await razorpay.orders.create(options);

    if(order) {
        console.log(`Order createde: ${JSON.stringify(order)}`);
    } else {
        console.log(`Order not created`);
    }
    // Store payment info in database with pending status
    const payment = new Payment({
      amount,
      currency,
      userId,
      auctionId,
      paymentType,
      paymentMethod: 'razorpay',
      transactionId: order.id,
      paymentStatus: 'pending'
    });

    await payment.save();

    // Send the order details to the frontend
    return res.status(200).json({
      success: true,
      order,
      payment: {
        id: payment._id
      },
      key: process.env.RAZORPAY_API_ID,
      user: {
        name: user.name,
        email: user.email,
        mobile: user.mobile
      },
      redirects: {
        success: redirectSuccess || `/payment-success?orderId=${order.id}`,
        failure: redirectFailure || `/payment-failure?orderId=${order.id}`
      }
    });
    
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing payment request',
      error: error.message
    });
  }
};


export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      paymentId
    } = req.body;

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Missing required parameters'
      });
    }

    // Verify the signature
    const shasum = createHmac('sha256', process.env.RAZORPAY_API_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    // If signatures don't match, payment is not legitimate
    if (digest !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // Find the payment by transactionId (which is the order_id)
    const payment = await Payment.findOne({ 
      transactionId: razorpay_order_id 
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Fetch payment details from Razorpay to double check status
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (paymentDetails.status !== 'captured') {
      payment.paymentStatus = 'failed';
      await payment.save();
      
      return res.status(400).json({
        success: false,
        message: `Payment verification failed: ${paymentDetails.status}`,
        redirectUrl: `/payment-failure?paymentId=${payment._id}`
      });
    }

    
    payment.paymentStatus = 'completed';
    payment.transactionId = razorpay_payment_id; 
    await payment.save();

    // Handle auction bidder registration or final payment
    const auction = await Auction.findById(payment.auctionId);
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }
    console.log(`Before push: AuctionID: ${auction.id} \n Bidder: ${auction.bidders} userID ${payment.userId}`);
    if (payment.paymentType === 'emd') {
      // Add user to bidders array if not already in it
      if (!auction.bidders.includes(payment.userId)) {
        auction.bidders.push(payment.userId);
        console.log(`After push: AuctionID: ${auction.id} \n Bidder: ${auction.bidders} userID ${payment.userId}`);
        await auction.save();
      }
      
      return res.status(200).json({
        success: true,
        message: 'Payment successful. You are now registered for the auction.',
        payment,
        redirectUrl: `/auctions/${auction._id}`
      });
    } else if (payment.paymentType === 'final') {
      
      return res.status(200).json({
        success: true,
        message: 'Final payment successful. Auction purchase completed.',
        payment,
        redirectUrl: `/auctions/${auction._id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment
    });
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message,
      redirectUrl: '/payment-failure'
    });
  }
};


export const paymentWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature
    const shasum = createHmac('sha256', process.env.RAZORPAY_API_SECRET);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');
    
    if (digest !== signature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }
    
    const event = req.body;
    
    // Handle different webhook events
    if (event.event === 'payment.captured') {
      const paymentId = event.payload.payment.entity.notes.transactionId;
      
      // Find and update payment in database
      const payment = await Payment.findOne({ transactionId: paymentId });
      
      if (payment) {
        payment.paymentStatus = 'completed';
        await payment.save();
        
        // If payment is for EMD, add user to auction bidders
        if (payment.paymentType === 'emd') {
          const auction = await Auction.findById(payment.auctionId);
          if (auction && !auction.bidders.includes(payment.userId)) {
            auction.bidders.push(payment.userId);
            await auction.save();
          }
        }
      }
    } else if (event.event === 'payment.failed') {
      const paymentId = event.payload.payment.entity.notes.transactionId;
      
      // Find and update payment status
      const payment = await Payment.findOne({ transactionId: paymentId });
      
      if (payment) {
        payment.paymentStatus = 'failed';
        await payment.save();
      }
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Check if user is authorized to view this payment
    if (payment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this payment'
      });
    }
    
    return res.status(200).json({
      success: true,
      payment
    });
    
  } catch (error) {
    console.error('Error getting payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting payment status',
      error: error.message
    });
  }
};


export const cancelPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Check if payment is in pending state
    if (payment.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel payment in ${payment.paymentStatus} state`
      });
    }
    
    // Check if user is authorized to cancel this payment
    if (payment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this payment'
      });
    }
    
    // Update payment status
    payment.paymentStatus = 'failed';
    await payment.save();
    
    return res.status(200).json({
      success: true,
      message: 'Payment cancelled successfully',
      payment
    });
    
  } catch (error) {
    console.error('Error cancelling payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling payment',
      error: error.message
    });
  }
};
