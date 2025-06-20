// controller/notificationsController.js

import { Notification } from '../model/DBModel.js';

export const getNotification = async (req, res) => {
    const userId = req.user._id;
    
    try {
        let notifications;
        if(req.user.role === 'admin'){
            notifications = await Notification.find({receiver: { $in: [userId, 'admin']}}).sort({timestamp: -1});
        } else {
             notifications = await Notification.find({receiver: { $in: [userId, 'All']}}).sort({timestamp: -1});
        }

        return res.json({ notifications });
    } catch(error) {
        console.log(`ERROR: ${error.message}`);
        return res.status(500).json({
            message: `Error Fetching your notification`
        });
    }
}