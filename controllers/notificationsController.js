// controller/notificationsController.js

import { Notification } from '../model/DBModel.js';

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