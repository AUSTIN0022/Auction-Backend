import express from 'express';
import { getBidForAuction, placeBid } from '../../controllers/user/bitController.js';
import { isLoggedIn } from './../../middleware/isLoggedIn.js';
const router = express.Router();

router.use(isLoggedIn);

router.post('/auction/:id', placeBid)
router.post('/auction/:id', getBidForAuction);
// router.get('/',);

export default router