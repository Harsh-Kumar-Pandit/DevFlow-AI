import express from "express";
import protectRoute from "../middlewares/auth.middleware.js";
import {
    getProjectActivities,
    getTaskActivities
} from "../controllers/activity.controller.js";

const router = express.Router();

router.get(
    "/project/:projectId",
    protectRoute,
    getProjectActivities
);

router.get(
    "/task/:taskId",
    protectRoute,
    getTaskActivities
);

export default router;