import express from 'express';
import { createAuction, deleteAuctions, getAllAuctions, getAuctionById, getAuctionsCategories, updateAuctions } from '../../controllers/admin/auctionController.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { isLoggedIn } from '../../middleware/isLoggedIn.js';
import { uploadAuctionImages } from '../../utils/cloudinary.js';


const router = express.Router();

router.use(isLoggedIn, authorizeRole('admin'));


router.get('/', getAllAuctions);
router.post('/create', (req, res, next) => {
  console.log('[Router] Create auction route hit');
  next();
}, uploadAuctionImages.array('auction_images', 5), createAuction);

router.get('/categories', getAuctionsCategories);
router.get('/:id', getAuctionById);
router.put('/:id', uploadAuctionImages.array('auction_images', 5), updateAuctions);
router.delete('/:id',deleteAuctions);



export default router;

