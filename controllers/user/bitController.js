import mongoose from 'mongoose';
import { Auction, Bid } from '../../model/DBModel.js';
import createNotificationService from '../../utils/noticationService.js';
const ObjectId = mongoose.Types.ObjectId;


const notificationService = createNotificationService();

export const placeBid = async (req, res) => {
    console.log(`[User] In Place Bid`);
    const { bidAmount } = req.body;
    const  auctionId  = req.params.id;
    
    const userId = req.user._id;
    
    try {

        const auction = await Auction.findById(auctionId);
        
        if (!auction) {
            return res.status(404).json({
                message: "Auction not found"
            });
        }
        
        // auction is active
        if (auction.status !== 'active') {
            return res.status(400).json({
                message: "Cannot place bid on inactive auction"
            });
        }
        
        // end date has passed
        if (new Date() > new Date(auction.endDate)) {
            return res.status(400).json({
                message: "Auction has ended"
            });
        }
        
        // user is registered for the auction
        if (!auction.bidders.includes(userId)) {
            return res.status(403).json({
                message: "User is not registered for this auction"
            });
        }
        
        // highest bid
        let highestBid = auction.basePrice;
        if (auction.bidLog.length > 0) {
            await auction.populate('bidLog');
            highestBid = Math.max(...auction.bidLog.map(bid => bid.bidAmount));
        }
        
        // new bid > highest bid
        if (bidAmount <= highestBid) {
            return res.status(400).json({
                message: "Bid amount must be higher than the current highest bid",
                currentHighestBid: highestBid
            });
        }
        
        const newBid = new Bid({
            bidAmount,
            auctionId,
            userId,
            status: 'active'
        });
        
        await newBid.save();
        
        // previous highest bid status to 'outbid' if exists
        if (auction.bidLog.length > 0) {
            const highestBidDoc = await Bid.findOne({
                auctionId,
                status: 'winning'
            });
            
            if (highestBidDoc) {
                highestBidDoc.status = 'outbid';
                await highestBidDoc.save();
            }
        }
        
        // new bid to winning
        newBid.status = 'winning';
        await newBid.save();
        
        // bid to auction's bidLog
        auction.bidLog.push(newBid._id);
        await auction.save();

        await notificationService.sendNotification(
            auction.bidders,
            `Bid Placed: ${auction.title}`,
            'bid_placed',
        );
        
        return res.status(201).json({
            message: "Bid placed successfully",
            bid: newBid,
            isHighestBid: true
        });
        
    } catch (error) {
        console.error(`Error placing a Bid: Auction:${auctionId} User: ${userId}`, error);
        return res.status(500).json({
            error: error.message,
            message: "Internal Server Error"
        });
    }
};

export const getBidForAuction = async (req, res) => {
    console.log(`[User] In getBid For Auction`);
    const { auctionId } = req.params;
    
    try {
    
        const auction = await Auction.findById(auctionId);
        
        if (!auction) {
            return res.status(404).json({
                message: "Auction not found"
            });
        }
        
        // Populate bid log to get actual bid data
        await auction.populate({
            path: 'bidLog',
            populate: {
                path: 'userId',
                select: 'firstName lastName email' 
            }
        });
        
        // Sort bids by amount (highest first)
        const sortedBids = auction.bidLog.sort((a, b) => b.bidAmount - a.bidAmount);
        
        return res.status(200).json({
            auctionId,
            auctionTitle: auction.title,
            basePrice: auction.basePrice,
            bids: sortedBids,
            totalBids: sortedBids.length,
            highestBid: sortedBids.length > 0 ? sortedBids[0] : null
        });
        
    } catch (error) {
        console.error(`Error getting bids for Auction: ${auctionId}`, error);
        return res.status(500).json({
            error: error.message,
            message: "Internal Server Error"
        });
    }
};

export const getUserBids = async (req, res) => {
    console.log(`[User] In getUserBids`);
    const { userId } = req.params;
    
    try {
        // Find all bids by this user
        const userBids = await Bid.find({ userId })
            .populate('auctionId', 'title basePrice startDate endDate status')
            .sort({ createdAt: -1 });
        
        return res.status(200).json({
            bids: userBids,
            totalBids: userBids.length
        });
        
    } catch (error) {
        console.error(`Error getting bids for User: ${userId}`, error);
        return res.status(500).json({
            error: error.message,
            message: "Internal Server Error"
        });
    }
};

