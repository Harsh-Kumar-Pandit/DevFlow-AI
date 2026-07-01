import express from "express";
import protectRoute from "../middlewares/auth.middleware.js";

import {
    generateTaskDescription,
    suggestPriority,
    breakTaskIntoSubtasks,
    generateProjectSummary,
    generateSprintSummary,
    workspaceAIChat
} from "../controllers/ai.controller.js";

const router = express.Router();

router.post(
    "/generate-task-description",
    protectRoute,
    generateTaskDescription
);

router.post(
    "/suggest-priority",
    protectRoute,
    suggestPriority
);

router.post(
    "/break-task",
    protectRoute,
    breakTaskIntoSubtasks
);

router.post(

    "/project-summary",

    protectRoute,

    generateProjectSummary

);

router.post(

    "/sprint-summary",

    protectRoute,

    generateSprintSummary

);

router.post(

    "/chat",

    protectRoute,

    workspaceAIChat

);

export default router;
