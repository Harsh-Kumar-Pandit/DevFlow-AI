import express from "express";

import protectRoute from "../middlewares/auth.middleware.js";

import {

    createProject,

    getWorkspaceProjects,

    getProject,

    updateProject,

    deleteProject,

    getProjectBoard

} from "../controllers/project.controller.js";

const router = express.Router();

router.post(

    "/create",

    protectRoute,

    createProject

);

router.get(
    "/workspace/:workspaceId",
    protectRoute,
    getWorkspaceProjects
);

router.get(
    "/:projectId",
    protectRoute,
    getProject
);

router.patch(
    "/:projectId",
    protectRoute,
    updateProject
);

router.delete(
    "/:projectId",
    protectRoute,
    deleteProject
);

router.get(

    "/:projectId/board",

    protectRoute,

    getProjectBoard

);

export default router;