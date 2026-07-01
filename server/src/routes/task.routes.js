import express from "express";

import protectRoute from "../middlewares/auth.middleware.js";

import {
    createTask,
    getProjectTasks,
    getTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    addAttachment,
    deleteAttachment
} from "../controllers/task.controller.js";

const router = express.Router();

router.post(

    "/create",

    protectRoute,

    createTask

);

router.get(
    "/project/:projectId",
    protectRoute,
    getProjectTasks
);

router.get(
    "/:taskId",
    protectRoute,
    getTask
);

router.patch(
    "/:taskId",
    protectRoute,
    updateTask
);

router.patch(
    "/:taskId/status",
    protectRoute,
    updateTaskStatus
);

router.delete(
    "/:taskId",
    protectRoute,
    deleteTask
);

router.post(
    "/:taskId/attachment",
    protectRoute,
    addAttachment
);

router.delete(
    "/:taskId/attachment/:publicId",
    protectRoute,
    deleteAttachment
);

export default router;