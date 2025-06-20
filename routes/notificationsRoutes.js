// routes/notificationsRoutes.js
import express from 'express';
import { getNotification } from '../controllers/notificationsController.js';
import { isLoggedIn } from '../middleware/isLoggedIn.js';

const router = express.Router();

router.use(isLoggedIn);

router.get('/:userId', getNotification);


export default router;