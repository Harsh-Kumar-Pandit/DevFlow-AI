import express from "express";

import protectRoute from "../middlewares/auth.middleware.js";

import {

    getProjectCalendar

} from "../controllers/calendar.controller.js";

const router = express.Router();

router.get(

    "/project/:projectId",

    protectRoute,

    getProjectCalendar

);

export default router;