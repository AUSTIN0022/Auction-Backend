import { User } from "../../model/DBModel.js";
import createNotificationService from '../../utils/noticationService.js';


const notificationService = createNotificationService();

export const getAllUsers = async (req, res) => {
    try {
        const result = await User.aggregate([
            {
                $facet:{
                    "users":[
                        { $project: { _id: 1, name: 1, email: 1, createdAt: 1, verifyStatus: 1, isActive:1}}
                    ],
                    "statusCounts": [
                        {
                            $group: {
                                _id: "$verifyStatus",
                                count: { $sum: 1}
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    users: 1,
                    counts: {
                        $reduce: {
                            input: "$statusCounts",
                            initialValue: { approveUsers: 0, rejectUsers: 0, pendingUsers: 0},
                            in: {
                                approveUsers: {
                                    $cond: [
                                        { $eq: ["$$this._id", "verified"]},
                                        "$$this.count",
                                        "$$value.approveUsers"
                                    ]
                                },
                                rejectUsers: {
                                    $cond: [
                                        { $eq: ["$$this._id", "rejected"]},
                                        "$$this.count",
                                        "$$value.rejectUsers"
                                    ]
                                },
                                pendingUsers: {
                                    $cond: [
                                        { $eq: ["$$this._id", "pending"]},
                                        "$$this.count",
                                        "$$value.pendingUsers"
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        ]);

        const { users, counts } = result[0];
        
        
        res.json({ users, counts});

    }  catch (error) {
        console.error('Error fetching users with counts:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
};

export const getUserById = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findOne( {_id: userId}).select({password:0});
        
        if(!user){
            return res.json({ message: "User not found"});
        }

        return res.json( user );

    } catch(error) {
        console.error(`Error fetching user with ID ${userId} :`, error);
        res.status(500).json({ message: 'Internal server error' });

    }

};

export const verifyUser = async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await User.updateOne(
            { _id: userId },
            { $set: { verifyStatus: "verified" } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: "Unable to verify user" });
        }

        await notificationService.sendNotification( 
            userId, 
            `You are Verifyed:`, 
            'kyc_approved', 
        );

        return res.json({ success: true, message: "User verified" });

    } catch (error) {
        console.error(`Error verifying user with ID ${userId}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


export const rejectUser = async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await User.updateOne(
            { _id: userId,} ,
            { $set: { verifyStatus: "rejected" } }
        )

        if(!result) {
            return res.json({ succuss: false, message: "unable to rejected user"});
        }
        
        await notificationService.sendNotification( 
            userId, 
            `You are Rejected:`, 
            'kyc_rejected', 
        );
        return res.json({ succuss: true, message: "rejected user"});

    } catch(error) {
        console.error(`Error rejected user with ID ${userId} :`, error);
        res.status(500).json({ message: 'Internal server error' });

    }
};

export const getVerificationDocuments = async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await User.findOne( {_id: userId} ).select({ idProof:1});
        
        if(!result) {
            return res.json({ succes: false, message: `Error fetching User documents`});
        }

        return res.json({ succes: true, message: "User document", document: result.idProof});
    } catch(error) {
        console.error(`Error fetching user document with ID ${userId} :`, error);
        res.status(500).json({ message: 'Internal server error' });

    }
};