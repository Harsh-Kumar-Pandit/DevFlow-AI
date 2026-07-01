import express from "express";
import protectRoute from "../middlewares/auth.middleware.js";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get(
    "/",
    protectRoute,
    getNotifications
);

router.patch(
    "/:notificationId/read",
    protectRoute,
    markAsRead
);

router.patch(
    "/read-all",
    protectRoute,
    markAllAsRead
);

router.delete(
    "/:notificationId",
    protectRoute,
    deleteNotification
);

export default router;