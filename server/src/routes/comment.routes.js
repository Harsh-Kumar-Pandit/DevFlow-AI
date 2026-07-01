import express from "express";

import protectRoute from "../middlewares/auth.middleware.js";

import {
    addComment,
    deleteComment,
    getTaskComments,
    updateComment
} from "../controllers/comment.controller.js";

const router = express.Router();

router.post(

    "/add",

    protectRoute,

    addComment

);

router.get(
    "/task/:taskId",
    protectRoute,
    getTaskComments
);

router.patch(
    "/:commentId",
    protectRoute,
    updateComment
);

router.delete(
    "/:commentId",
    protectRoute,
    deleteComment
);

export default router;