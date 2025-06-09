import express from 'express';
import { login, logout, register } from '../controllers/authController.js';
import { uploadIdProof } from '../utils/cloudinary.js';



const router = express.Router();
router.get('/logout', logout);
router.post('/register', uploadIdProof.single('id_proof'), register);
router.post('/login', login);

export default router;
