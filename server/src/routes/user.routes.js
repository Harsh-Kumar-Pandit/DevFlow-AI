import express from "express";
import protectRoute from "../middlewares/auth.middleware.js";
import { searchUsers } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);

export default router;
