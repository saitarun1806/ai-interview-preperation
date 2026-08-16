import express from "express";

import { testGemini } from "../controllers/geminiController.js";

const router =express.Router();

router.post("/chat",testGemini);

export default router;