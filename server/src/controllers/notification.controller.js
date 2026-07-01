import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {

    try {

        const notifications = await Notification.find({
            recipient: req.user._id
        })
            .populate("sender", "fullName username")
            .populate("task", "title")
            .populate("project", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({

            success: true,

            count: notifications.length,

            notifications

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const markAsRead = async (req, res) => {

    try {

        const { notificationId } = req.params;

        const notification = await Notification.findById(notificationId);

        if (!notification) {

            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });

        }

        if (
            notification.recipient.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "Access denied"
            });

        }

        notification.isRead = true;

        await notification.save();

        return res.status(200).json({

            success: true,

            message: "Notification marked as read"

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const markAllAsRead = async (req, res) => {

    try {

        await Notification.updateMany(

            {
                recipient: req.user._id,
                isRead: false
            },

            {
                $set: {
                    isRead: true
                }
            }

        );

        return res.status(200).json({

            success: true,

            message: "All notifications marked as read"

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const deleteNotification = async (req, res) => {

    try {

        const { notificationId } = req.params;

        const notification = await Notification.findById(notificationId);

        if (!notification) {

            return res.status(404).json({

                success: false,

                message: "Notification not found"

            });

        }

        if (
            notification.recipient.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({

                success: false,

                message: "Access denied"

            });

        }

        await Notification.findByIdAndDelete(notificationId);

        return res.status(200).json({

            success: true,

            message: "Notification deleted successfully"

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};