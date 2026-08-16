import express from "express";
import cors from "cors";


import connectDB from "./config/db.js";

import resumeRoutes from "./routes/resumeRoutes.js";
import authRoutes from "./routes/loginRoutes.js";
import geminiRoutes from "./routes/geminiRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";

import jwtAuth from "./middleware/jwtAuth.js";

import dotenv from "dotenv";

dotenv.config();


const app = express();



connectDB();

const allowedOrigins = [
  "https://ai-interview-preperation-six.vercel.app",
  "http://localhost:5173",
];

app.use(cors({
  origin: function (origin, callback) {
   
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.get("/api/test", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is working",
    });
});



app.use("/api/auth", authRoutes);


app.use("/api/resume", jwtAuth, resumeRoutes);


app.use("/api/gemini", jwtAuth, geminiRoutes);


app.use("/api/interview", jwtAuth, interviewRoutes);




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});