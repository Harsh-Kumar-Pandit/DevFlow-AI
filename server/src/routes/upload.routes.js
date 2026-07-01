import express from "express";

import protectRoute from "../middlewares/auth.middleware.js";

import upload from "../middlewares/upload.middleware.js";

import {

    uploadFile,

    deleteFile

} from "../controllers/upload.controller.js";

const router = express.Router();

router.post(

    "/",

    protectRoute,

    upload.single("file"),

    uploadFile

);

router.delete(

    "/:publicId",

    protectRoute,

    deleteFile

);

export default router;