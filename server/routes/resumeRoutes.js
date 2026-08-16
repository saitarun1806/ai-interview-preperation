import express from "express";

import upload from "../middleware/upload.js";

import {
    uploadResume,
    getResume,
} from "../controllers/resumeController.js";

const router = express.Router();

router.post(
    "/upload",
    upload.single("resume"),
    uploadResume
);

router.get(
    "/",
    getResume
);

export default router;