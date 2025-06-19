// routes/user/userRoutes.js
import express from 'express';
import { getNotification, getUserDashboard } from '../../controllers/userDashboard.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { isLoggedIn } from '../../middleware/isLoggedIn.js';

const router = express.Router();

router.use(isLoggedIn, authorizeRole('user'));

router.get('/',  getUserDashboard);
router.get('/:userId', getNotification);


export default router;