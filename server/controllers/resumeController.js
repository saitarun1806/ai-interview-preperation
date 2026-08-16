import Resume from "../models/Resume.js";
import { extractTextFromPDF } from "../services/pdfService.js";
import { parseResumeData } from "../services/geminiService.js";

export const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Resume file is required",
            });
        }

        const resumeText = await extractTextFromPDF(
            req.file.buffer
        );

        if (!resumeText || !resumeText.trim()) {
            return res.status(400).json({
                success: false,
                message: "Could not extract text from resume",
            });
        }

        
        
        
        let parsedData = {};

        try {
            parsedData = await parseResumeData(resumeText.trim());
        } catch (parseErr) {
            console.error("Gemini resume parsing error:", parseErr);
        }

        const resume = await Resume.findOneAndUpdate(
            {
                userId: req.user._id,
            },
            {
                userId: req.user._id,
                fileName: req.file.originalname,
                resumeText: resumeText.trim(),
                parsedData,
                uploadedAt: new Date(),
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            success: true,
            message: "Resume uploaded and processed successfully",
            resume: {
                id: resume._id,
                fileName: resume.fileName,
                uploadedAt: resume.uploadedAt,
                parsedData: resume.parsedData,
            },
        });

    } catch (error) {
        console.error(
            "Resume upload error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to process resume",
        });
    }
};

export const getResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({
            userId: req.user._id,
        }).select(
            "fileName uploadedAt createdAt updatedAt parsedData"
        );

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "No resume found",
            });
        }

        res.status(200).json({
            success: true,
            resume,
        });

    } catch (error) {
        console.error(
            "Get resume error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to get resume",
        });
    }
};