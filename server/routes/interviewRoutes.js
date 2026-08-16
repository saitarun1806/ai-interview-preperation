import express from "express";

import {
    getNextQuestion,
    submitAnswer,
    submitLevel,
    completeInterview,
    getProgress,
    getResults,
    getResultById,
} from "../controllers/interviewController.js";

const router = express.Router();




router.get("/question", getNextQuestion);
router.post("/answer", submitAnswer);



router.post("/submit-level", submitLevel);


router.post("/complete", completeInterview);


router.get("/progress", getProgress);


router.get("/results", getResults);
router.get("/results/:id", getResultById);

export default router;