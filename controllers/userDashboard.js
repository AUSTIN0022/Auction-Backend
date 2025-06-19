// controller/userDashboard.js
import mongoose from 'mongoose';
import { Auction, Bid, Notification, Payment, User } from '../model/DBModel.js';

export const getUserDashboard = async (req, res) => {
    console.log('[User] In getUserDashboard');
  try {
    const userId = req.user._id;
    
    // Get user with wallet information
    const user = await User.findById(userId).select('wallet');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Parallel queries for better performance
    const [
      activeBids,
      wonAuctions,
      paymentHistory,
      recommendedAuctions
    ] = await Promise.all([
      // Get active bids with auction details
      Bid.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            status: { $in: ['active', 'winning'] },
            isDeleted: false
          }
        },
        {
          $lookup: {
            from: 'auctions',
            localField: 'auctionId',
            foreignField: '_id',
            as: 'auction'
          }
        },
        {
          $unwind: '$auction'
        },
        {
          $match: {
            'auction.status': 'active',
            'auction.isDeleted': false
          }
        },
        {
          $lookup: {
            from: 'bids',
            let: { auctionId: '$auctionId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$auctionId', '$$auctionId'] },
                  isDeleted: false
                }
              },
              { $sort: { bidAmount: -1 } },
              { $limit: 1 }
            ],
            as: 'highestBid'
          }
        },
        {
          $addFields: {
            highestBidAmount: {
              $ifNull: [{ $arrayElemAt: ['$highestBid.bidAmount', 0] }, '$auction.basePrice']
            },
            endsIn: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$auction.endDate'
              }
            }
          }
        },
        {
          $project: {
            title: '$auction.title',
            yourBid: '$bidAmount',
            highestBid: '$highestBidAmount',
            status: {
              $cond: {
                if: { $eq: ['$bidAmount', '$highestBidAmount'] },
                then: 'Winning',
                else: 'Outbid'
              }
            },
            endsIn: 1,
            auctionId: '$auctionId'
          }
        }
      ]),

      // Get won auctions
      Auction.aggregate([
        {
          $match: {
            winner: new mongoose.Types.ObjectId(userId),
            status: 'completed',
            isDeleted: false
          }
        },
        {
          $lookup: {
            from: 'payments',
            let: { auctionId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { 
                    $and: [
                      { $eq: ['$auctionId', '$$auctionId'] },
                      { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] },
                      { $eq: ['$paymentType', 'final'] }
                    ]
                  }
                }
              }
            ],
            as: 'payment'
          }
        },
        {
          $lookup: {
            from: 'bids',
            let: { auctionId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$auctionId', '$$auctionId'] },
                      { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] }
                    ]
                  }
                }
              },
              { $sort: { bidAmount: -1 } },
              { $limit: 1 }
            ],
            as: 'winningBid'
          }
        },
        {
          $project: {
            title: 1,
            finalBid: { $arrayElemAt: ['$winningBid.bidAmount', 0] },
            wonDate: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$endDate'
              }
            },
            paymentStatus: {
              $ifNull: [
                { $arrayElemAt: ['$payment.paymentStatus', 0] },
                'pending'
              ]
            }
          }
        }
      ]),

      // Get payment history
      Payment.find({
        userId: userId,
        isDeleted: false
      })
      .select('_id paymentType amount createdAt paymentStatus')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

      // Get recommended auctions (active auctions user hasn't bid on)
      Auction.aggregate([
        {
          $match: {
            status: 'active',
            endDate: { $gt: new Date() },
            bidders: { $nin: [new mongoose.Types.ObjectId(userId)] },
            isDeleted: false
          }
        },
        {
          $lookup: {
            from: 'bids',
            let: { auctionId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$auctionId', '$$auctionId'] },
                  isDeleted: false
                }
              },
              { $sort: { bidAmount: -1 } },
              { $limit: 1 }
            ],
            as: 'highestBid'
          }
        },
        {
          $addFields: {
            currentBid: {
              $ifNull: [{ $arrayElemAt: ['$highestBid.bidAmount', 0] }, '$basePrice']
            },
            endsIn: {
              $let: {
                vars: {
                  diffMs: { $subtract: ['$endDate', new Date()] }
                },
                in: {
                  $cond: {
                    if: { $gt: ['$$diffMs', 86400000] }, // > 24 hours
                    then: {
                      $concat: [
                        { $toString: { $floor: { $divide: ['$$diffMs', 86400000] } } },
                        ' days'
                      ]
                    },
                    else: {
                      $concat: [
                        { $toString: { $floor: { $divide: ['$$diffMs', 3600000] } } },
                        ' hours'
                      ]
                    }
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            id: '$_id',
            title: 1,
            currentBid: 1,
            status: 'Active',
            endsIn: 1
          }
        },
        { $limit: 6 }
      ])
    ]);

    // Calculate stats
    const stats = {
      activeBids: activeBids.length,
      wonAuctions: wonAuctions.length,
      balance: user.wallet?.balance || 0,
      watchlist: 0 
    };

    // Format payment history
    const formattedPayments = paymentHistory.map(payment => ({
      id: payment._id.toString().slice(-8).toUpperCase(),
      type: payment.paymentType,
      amount: payment.amount,
      date: payment.createdAt.toISOString().split('T')[0],
      status: payment.paymentStatus
    }));

    // Calculate account summary
    const totalSpent = await Payment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          paymentStatus: 'completed',
          paymentType: { $in: ['final', 'emd'] },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const pendingPayments = await Payment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          paymentStatus: 'pending',
          paymentType: 'final',
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const accountSummary = {
      available: user.wallet?.balance || 0,
      pending: pendingPayments[0]?.total || 0,
      total: totalSpent[0]?.total || 0
    };

    // Prepare response data
    const dashboardData = {
      stats,
      bids: activeBids,
      won: wonAuctions,
      payments: formattedPayments,
      accountSummary,
      recommended: recommendedAuctions
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

export const getNotification = async (req, res) => {
    const userId = req.user._id;

    try{
        const notifications = await Notification.find({receiver: { $in: [userId, 'All']}});

        return res.json({ notifications });
    } catch(error) {
        console.log(`ERROR: ${error.message}`);
        return res.status(500).json({
            message: `Error Fetching your notification`
        });
    }
}