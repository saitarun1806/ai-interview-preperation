import mongoose from "mongoose";

const resultAttemptSchema = new mongoose.Schema(
    {
        level: Number,
        difficulty: String,
        type: { type: String, enum: ["skill", "project", "introduction"] },
        topic: String,
        question: String,
        answer: String,
        accuracy: { type: Number, default: null }, 
        feedback: String,
        passed: { type: Boolean, default: null }, 
        attemptedAt: Date,
    },
    { _id: false }
);



const levelResultSchema = new mongoose.Schema(
    {
        level: Number,
        overallScore: Number,
        passed: Boolean,
    },
    { _id: false }
);

const interviewResultSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        finalLevel: {
            type: Number,
            required: true,
        },

        questionsAttempted: {
            type: Number,
            required: true,
        },

        questionsPassed: {
            type: Number,
            required: true,
        },

        averageAccuracy: {
            type: Number,
            required: true,
        },

        levelResults: {
            type: [levelResultSchema],
            default: [],
        },

        history: {
            type: [resultAttemptSchema],
            default: [],
        },

        completedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export default mongoose.model("InterviewResult", interviewResultSchema);