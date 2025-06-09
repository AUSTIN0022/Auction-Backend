// routes/user/userRoutes.js
import express from 'express';
import { getUserDashboard } from '../../controllers/userDashboard.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { isLoggedIn } from '../../middleware/isLoggedIn.js';

const router = express.Router();

router.use(isLoggedIn, authorizeRole('user'));

// GET /api/dashboard - Get user dashboard data
router.get('/',  getUserDashboard);

export default router;