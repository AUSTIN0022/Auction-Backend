import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ID proofs
const idProofStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'id_proofs',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    },
});

// Auction images
const auctionImageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'auction_images',
        allowed_formats: ['jpg', 'jpeg', 'png'],
    },
});

// multer 
const uploadIdProof = multer({ storage: idProofStorage });
const uploadAuctionImages = multer({ storage: auctionImageStorage });

export {
    cloudinary, uploadAuctionImages, uploadIdProof
};
