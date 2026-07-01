import express from "express";
import protectRoute from "../middlewares/auth.middleware.js";
import { searchTasks } from "../controllers/search.controller.js";

const router = express.Router();

router.get(
    "/tasks",
    protectRoute,
    searchTasks
);

export default router;