import mongoose from "mongoose";


const attemptSchema = new mongoose.Schema(
    {
        level: { type: Number, required: true },
        difficulty: { type: String, required: true },
        type: { type: String, enum: ["skill", "project", "introduction"], required: true },
        topic: { type: String, required: true }, 
        question: { type: String, required: true },
        answer: { type: String, required: true },
        
        
        accuracy: { type: Number, default: null },
        feedback: { type: String, default: "" },
        passed: { type: Boolean, default: null },
        attemptedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);




const batchQuestionSchema = new mongoose.Schema(
    {
        level: { type: Number, required: true },
        difficulty: { type: String, required: true },
        type: { type: String, enum: ["skill", "project", "introduction"], required: true },
        topic: { type: String, required: true },
        question: { type: String, required: true },
    },
    { _id: false }
);

const interviewProgressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        currentLevel: {
            type: Number,
            default: 1,
            min: 1,
            max: 100,
        },

        
        
        currentLevelQuestions: {
            type: [batchQuestionSchema],
            default: [],
        },

        
        
        
        currentAnswers: {
            type: [String],
            default: [],
        },

        
        currentQuestionIndex: {
            type: Number,
            default: 0,
        },

        
        
        history: {
            type: [attemptSchema],
            default: [],
        },
    },
    { timestamps: true }
);

export default mongoose.model("InterviewProgress", interviewProgressSchema);