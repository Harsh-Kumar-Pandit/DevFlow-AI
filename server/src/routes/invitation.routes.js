import express from "express";
import protectRoute from "../middlewares/auth.middleware.js";
import {
    acceptInvitation,
    declineInvitation
} from "../controllers/invitation.controller.js";

const router = express.Router();

router.post("/:id/accept", protectRoute, acceptInvitation);
router.post("/:id/decline", protectRoute, declineInvitation);

export default router;
