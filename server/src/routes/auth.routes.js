import express from "express";
import {
    registerUser,
    loginUser,
    getCurrentUser
} from "../controllers/auth.controller.js";

import protectRoute from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protectRoute, getCurrentUser);

export default router;