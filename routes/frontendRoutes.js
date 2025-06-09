import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authorizeRole } from '../middleware/authorizeRole.js';
import { isLoggedIn } from '../middleware/isLoggedIn.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// General 
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/landing-page.html'));
});

router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/registration.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

router.get('/terms-conditions', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/terms-conditions.html'));
});


// Only Admin

router.get('/admin-dashboard', isLoggedIn, authorizeRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin-dashboard.html'));
});

router.get('/create-auction', isLoggedIn,  authorizeRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/create-auction.html'));
});


router.get('/user-detail/:id', isLoggedIn, authorizeRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/userDetails.html'));
});

router.get('/auctions/edit/:id', isLoggedIn, authorizeRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/update-auction.html'));
});

router.get('/user-verification', isLoggedIn, authorizeRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/user-verification.html'));
});

// Only User
router.get('/dashboard', isLoggedIn, authorizeRole('user'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/user-dashboard.html'));
});
router.get('/auctions', isLoggedIn, authorizeRole('user'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/browseAuctions.html'));
});
// router.get('/auctions/:id', isLoggedIn, authorizeRole('user'), (req, res) => {
//     res.sendFile(path.join(__dirname, '../views/viewAuctionDetails.html'));
// });

// Both Admin & User

router.get('/view-auctions', isLoggedIn,  authorizeRole(['admin','user']), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/view-auctions.html'));
});

router.get('/auctions/:id', isLoggedIn,  authorizeRole(['admin','user']), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/auction-detail.html'));
});


// payment
router.get('/checkout', isLoggedIn,  authorizeRole(['admin','user']), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/checkout.html'));
});

router.get('/payment-success', isLoggedIn,  authorizeRole(['admin','user']), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/payment-success.html'));
});

router.get('/payment-failure', isLoggedIn,  authorizeRole(['admin','user']), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/payment-failure.html'));
});

// Error page route
router.get('/error', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/error.html'));
  });

export default router;