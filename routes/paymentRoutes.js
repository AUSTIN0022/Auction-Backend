
import express from 'express';
import { cancelPayment, createPayment, getPaymentStatus, paymentWebhook, verifyPayment } from '../controllers/paymentController.js';
import { isLoggedIn } from '../middleware/isLoggedIn.js';
const router = express.Router();

// Create payment and generate order
router.post('/create', isLoggedIn, createPayment);

// Verify payment after successful completion
router.post('/verify', isLoggedIn, verifyPayment);

// Webhook for Razorpay events (no authentication as it's called by Razorpay)
router.post('/webhook', paymentWebhook);

// Get payment status
router.get('/:id', isLoggedIn, getPaymentStatus);

// Cancel pending payment
router.post('/:id/cancel', isLoggedIn, cancelPayment);

export default router;