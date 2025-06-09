import express from 'express';
import { getAllUsers, getUserById, getVerificationDocuments, rejectUser, verifyUser } from '../../controllers/admin/userController.js';
import { authorizeRole } from './../../middleware/authorizeRole.js';
import { isLoggedIn } from './../../middleware/isLoggedIn.js';

const router = express.Router();
router.use(isLoggedIn, authorizeRole('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/verify',verifyUser);
router.put('/:id/reject', rejectUser);
router.get('/:id/documents', getVerificationDocuments);

export default router;
