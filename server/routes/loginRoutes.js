import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { verifyUser } from "../controllers/loginController.js";

const router = express.Router();

router.get("/verify", authMiddleware, verifyUser);

export default router;