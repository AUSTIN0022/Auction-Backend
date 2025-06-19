import express from 'express';
import {
    browseAuctions,
    closeAuction,
    getParticipatingAuctions,
    viewAuctionDetails
} from '../../controllers/user/auctionController.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { isLoggedIn } from '../../middleware/isLoggedIn.js';

const router = express.Router();

router.get('/', isLoggedIn, browseAuctions);
router.get('/:id',isLoggedIn, viewAuctionDetails);

router.use(isLoggedIn, authorizeRole('user'));

router.post('/close', closeAuction);

router.get('/participating', getParticipatingAuctions);

export default router;