import { Auction } from '../../model/DBModel.js';
import createNotificationService from '../../utils/noticationService.js';


const notificationService = createNotificationService();


export const browseAuctions = async (req, res) => {
    console.log(`In browse Auctions`);
    try {
            const auctions = await Auction.find({ isDeleted: false }).sort({createdAt: -1});
            if(!auctions){
                return res.status(400).json({
                    success: false,
                    message: "error getting auctions from the database"
                });
            }
    
            return res.json({
                success: true,
                message: "All Auctions details",
                auctions
            })
        } catch(error) {
            console.log(`Error fetching all Auctions`)
            return res.status(500).json({
                error: error.message,
                message: 'Internal Server Error'
            });
        }
}

export const viewAuctionDetails = async (req, res) => {
    console.log(`In view Auction Details`);
    
    const auctionId =  req.params.id;
    
    if(!auctionId){
        return res.status(400).json({
            success: false,
            message: "please provide the Auction Id"
        });
    }
    try {
        const auctionDetails = await Auction.findById({ _id: auctionId })
                .select('-__v -updatedAt -createdAt -isDeleted -deletedAt')
                .populate({
                    path: 'bidders',
                    select: '-wallet -password -address -idProof -profileImage -mobile -email -__v -createdAt -updatedAt -isDeleted -deletedAt'
                })
                .populate({
                    path: 'bidLog',
                    select: '-__v -updatedAt -isDeleted -deletedAt'
                });


        if(!auctionDetails) {
            return res.status(404).json({
                success: false,
                message: `Could not find Auction`
            });
        }
        
        // console.log(`AUCTION: ${JSON.stringify(auctionDetails)}`)
        return res.json({
            success: true,
            message: 'Auctions found',
            auctionDetails
        })
    } catch(error) {
        console.log(`Error fetching the Auction details of ${auctionId}: ${error.message}`);
        return res.status(500).json({
            error: error.message,
            message: "Internal server Error"
        })
    }
      
}

export const closeAuction = async (req, res) => {
    const { auctionId, userId} = req.body;
    console.log(`In closeAuction: \n Body: ${JSON.stringify(req.body)}`);

    try {
        if(!auctionId && !userId) return res.json({ message: "Please provide the Acution ID & user ID"});

        const auction = await Auction.findByIdAndUpdate(auctionId, {winner: userId, status: "completed"},{new: true})

        console.log(`Winner: ${auction.winner}`);

        await notificationService.sendNotification(
            [auction.winner],
            `You Won the Auction: ${auction.title}`,
            'auction_won',
        );
    
        await notificationService.sendNotification(
            auction.bidders,
            `Auction Closed: ${auction.title}`,
            'auction_ended',
        );

        return res.json({
            message: `Auction Completed`
        });
    } catch(err) {
        console.log(`Error: ${err.message}`);
        return res.status(500).json({
            message: "Error closing the Auction"
        });
    }

}

export const getParticipatingAuctions = async (req, res) => {
    
}


