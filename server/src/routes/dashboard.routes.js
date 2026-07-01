import express from "express";

import protectRoute from "../middlewares/auth.middleware.js";

import {
    getWorkspaceDashboard
} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get(
    "/workspace/:workspaceId",
    protectRoute,
    getWorkspaceDashboard
);

export default router;