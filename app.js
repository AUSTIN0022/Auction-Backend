import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { NotificationToken } from './model/DBModel.js';
import adminAuctionRoutes from './routes/admin/auctionRoutes.js';
import adminUserRoutes from './routes/admin/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userAuctionRoutes from './routes/user/auctionRoutes.js';
import userBidRoutes from './routes/user/bidRoutes.js';
import userDashboardRoutes from './routes/user/userRoutes.js';
import createNotificationService from './utils/noticationService.js';

const notificationService = createNotificationService();

dotenv.config();
const app = express();


app.use(cors({
  origin: [
    'https://bidbazaar.shop',
    'https://www.bidbazaar.shop',
    'https://api.bidbazaar.shop',
    'https://www.bidbazaar.shop',
    'https://dev.bidbazaar.shop',
    'http://localhost:5173',
    'http://localhost:3000' 
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));


app.use(express.static('views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(cookieParser());

app.use((err, req, res, next) => {
  console.error(err.stack); // logs actual error
  res.status(500).json({ success: false, message: 'Server error' });
});


try {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log('MongoDB connected successfully');
} catch (error) {
  console.error('MongoDB connection error:', error);
  process.exit(1);
}

import './utils/worker/updateAuctionsStatus.js';

// Old Frontend
// app.use('/', frontendRoutes);


// Payment
app.use('/api/payments', paymentRoutes);

// Notifications
app.use('/api/notifications', notificationsRoutes);

// Backend
// Admin
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/auction', adminAuctionRoutes);

// User
app.use('/api/dashboard', userDashboardRoutes); 
app.use('/api/auctions', userAuctionRoutes);
app.use('/api/bids', userBidRoutes);

import admin from './utils/firebase-admin.js';

// Add this route to test direct FCM
app.get('/api/test-fcm-direct', async (req, res) => {
  try {
    const tokens = await NotificationToken.find({ role: 'user' });
    console.log(`Found ${tokens.length} tokens to test`);
    
    if (tokens.length === 0) {
      return res.json({ success: false, error: 'No tokens found' });
    }
    
    const token = tokens[0].token; // Test with first token
    console.log(`Testing with token: ${token.substring(0, 20)}...`);
    
    const message = {
      token: token,
      notification: {
        title: 'Direct Test',
        body: 'This is a direct FCM test'
      },
      data: {
        type: 'test',
        auctionId: '12345'
      }
    };
    
    const result = await admin.messaging().send(message);
    console.log('Direct FCM result:', result);
    
    res.json({ success: true, result, tokenUsed: token.substring(0, 20) + '...' });
  } catch (error) {
    console.error('Direct FCM error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Register FCM token for a user/device
app.post('/api/register-token', async (req, res) => {
  const { token, role, userId } = req.body;

  console.log(`IN API route, ROLE: ${role}, USERID: ${userId}`);
  
  if (!token) {
    return res.status(400).json({ 
      success: false, 
      error: 'Token is required' 
    });
  }
  
  try {
    // Use the notification service to register the token
    const success = await notificationService.registerToken(token, role || 'user', userId || null);
    
    if (success) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to register token' 
      });
    }
  } catch (error) {
    console.error('Error registering token:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// Test endpoint to send a notification (for development)
app.post('/api/test-notification', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ success: false, error: 'Only available in development mode' });
  }
  
  const { type, message, receiver } = req.body;
  
  if (!type || !message) {
    return res.status(400).json({ success: false, error: 'Type and message are required' });
  }
  
  try {
    const result = await notificationService.sendNotification(
      receiver || 'all',
      message,
      type,
      req.body.options || {}
    );
    
    return res.json({ 
      success: true, 
      result 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(process.env.PORT, () => {
    console.log(`listening on port http://localhost:${process.env.PORT}.....`);
    console.log("Live on https://dev.bidbazaar.shop");
});
