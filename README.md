# Auction Backend

This is the backend service for an online auction platform. It is built with **Node.js**, **Express.js**, and **MongoDB**, with integrations for **Firebase** notifications and **Razorpay** payments. The backend supports admin and user flows, authentication, and real-time alerts.

---

## 📁 Project Structure


```
├── app.js # Main entry point
├── db-init.js # Initializes database
├── package.json # Project dependencies and scripts
├── .env # Environment variables
├── controllers/ # Business logic
├── routes/ # API endpoints
├── middleware/ # Express middleware (auth, validation, etc.)
├── model/ # Mongoose models (MongoDB)
├── config/ # Configuration files (Firebase, DB, etc.)
├── public/ # Static assets (if used)
├── views/ # View templates (optional)
├── utils/ # Helper utilities
├── generate-service-account.js
├── getToken.cjs
├── serviceAccountKey.json # Firebase credentials
├── Admin Flow Endpoints.txt # API flow for admin features
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB instance
- Firebase project (for notifications)
- Razorpay account (for payments)

### Installation

1. **Clone the repository** and install dependencies:

```bash
git clone <repo-url>
cd Auction-Backend
npm install
```

2. **Install Dependencies**
   ```npm  install```

3. **Setup Environment Variables:**
Create a ``.env`` file in the root directory with values like:

env
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/auctiondb

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"

RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

```

4. **Initialize Database** *(optional for seeding):*
```node db-init.js```

5. **Start the Server:**
```npm start```

The server will start on http://localhost:5000.

## 🔐 Features
- Admin and User Roles with route protection
- Firebase Push Notifications via service account
- Razorpay Payment Integration
- RESTful API Design
- Modular MVC structure for scalability

## 📄 API Documentation

🔐 Most routes are protected and require JWT authentication.

### Auth Routes
+ ```POST /api/auth/register``` — Register user
+ ```POST /api/auth/login``` — Login and get token

### Auction Routes
+ ```POST /api/auction/create``` — Create auction (Admin only)
+ ```GET /api/auction/list``` — Get active auctions
+ ```POST /api/auction/bid/:id``` — Place bid

### Payment Routes
+ ```POST /api/payment/register``` — Register for auction (creates Razorpay order)
+ ```POST /api/payment/confirm``` — Confirm payment

### Notifications
+ Uses Firebase Cloud Messaging (FCM)
+ ```POST /api/notifications/send``` — Send notification to users

Refer to ```Admin Flow Endpoints.txt``` for admin-side API descriptions. A Postman collection is recommended for testing all routes.

### 🛠 Scripts
+ ```npm start```: Start server
+ ```node db-init.js```: Initialize DB with default values
+ ```node generate-service-account.js```: Setup Firebase service account
+ ```node getToken.cjs```: Retrieve Firebase messaging token

### 📦 Dependencies
+ Express
+ Mongoose
+ Firebase Admin SDK
+ Razorpay Node SDK

