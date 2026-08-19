import express from "express";
import protectRoute from "../middlewares/auth.middleware.js";
import {
    acceptJoinRequest,
    createWorkspace,
    deleteWorkspace,
    getJoinRequests,
    getMyWorkspaces,
    joinWorkspace,
    leaveWorkspace,
    rejectJoinRequest,
    removeMember
} from "../controllers/workspace.controller.js";
import { inviteMember } from "../controllers/invitation.controller.js";

const router = express.Router();

router.post(
    "/create",
    protectRoute,
    createWorkspace
);

router.post(
    "/:workspaceId/invite",
    protectRoute,
    inviteMember
);
router.get(
    "/my-workspaces",
    protectRoute,
    getMyWorkspaces
);
router.post(
    "/join",
    protectRoute,
    joinWorkspace
);
router.get(
    "/:workspaceId/requests",
    protectRoute,
    getJoinRequests
);

router.post(
    "/request/:requestId/accept",
    protectRoute,
    acceptJoinRequest
);

router.post(
    "/request/:requestId/reject",
    protectRoute,
    rejectJoinRequest
);

router.delete(
    "/:workspaceId/member/:userId",
    protectRoute,
    removeMember
);

router.delete(
    "/leave/:workspaceId",
    protectRoute,
    leaveWorkspace
);

router.delete(
    "/:workspaceId",
    protectRoute,
    deleteWorkspace
);

export default router;

