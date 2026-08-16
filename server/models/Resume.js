import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        fileName: {
            type: String,
            required: true,
        },

        resumeText: {
            type: String,
            required: true,
        },

        
        parsedData: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;