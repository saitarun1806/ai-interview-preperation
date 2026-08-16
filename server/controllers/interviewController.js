import Resume from "../models/Resume.js";
import InterviewProgress from "../models/InterviewProgress.js";
import InterviewResult from "../models/InterviewResult.js";
import {
    generateQuestionBatch,
    evaluateAnswerBatch,
    PASS_THRESHOLD,
} from "../services/interviewService.js";



const BATCH_SIZE = 15;

const getOrCreateProgress = async (userId) => {
    let progress = await InterviewProgress.findOne({ userId });

    if (!progress) {
        progress = await InterviewProgress.create({ userId, currentLevel: 1 });
    }

    return progress;
};

const getSkillsAndProjects = async (userId) => {
    const resume = await Resume.findOne({ userId });

    const skills = resume?.parsedData?.skills || [];
    const projects = resume?.parsedData?.projects || [];

    return { skills, projects };
};





const ensureCurrentLevelBatch = async (progress, skills, projects) => {
    if (progress.currentLevelQuestions && progress.currentLevelQuestions.length > 0) {
        const batchIsStaleComplete =
            progress.currentQuestionIndex >= progress.currentLevelQuestions.length ||
            progress.currentAnswers.length !== progress.currentLevelQuestions.length;

        if (!batchIsStaleComplete) {
            return progress;
        }

        progress.currentLevelQuestions = [];
        progress.currentAnswers = [];
        progress.currentQuestionIndex = 0;
        await progress.save();
    }

    const questions = await generateQuestionBatch(
        progress.currentLevel,
        skills,
        projects,
        BATCH_SIZE
    );

    progress.currentLevelQuestions = questions;
    progress.currentAnswers = new Array(questions.length).fill("");
    progress.currentQuestionIndex = 0;

    await progress.save();

    return progress;
};





export const getNextQuestion = async (req, res) => {
    try {
        let progress = await getOrCreateProgress(req.user._id);
        const { skills, projects } = await getSkillsAndProjects(req.user._id);

        if (skills.length === 0 && projects.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload a resume with skills or projects before starting the interview.",
            });
        }

        progress = await ensureCurrentLevelBatch(progress, skills, projects);

        if (progress.currentQuestionIndex >= progress.currentLevelQuestions.length) {
            return res.status(400).json({
                success: false,
                message: "All questions for this level are answered — submit them with POST /submit-level.",
            });
        }

        const question = progress.currentLevelQuestions[progress.currentQuestionIndex];

        res.status(200).json({
            success: true,
            currentLevel: progress.currentLevel,
            questionIndex: progress.currentQuestionIndex,
            totalQuestions: progress.currentLevelQuestions.length,
            passThreshold: PASS_THRESHOLD,
            question,
        });

    } catch (error) {
        console.error("Get interview question error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate interview question",
        });
    }
};







export const submitAnswer = async (req, res) => {
    try {
        const { answer } = req.body;

        const progress = await getOrCreateProgress(req.user._id);

        if (!progress.currentLevelQuestions || progress.currentLevelQuestions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No active question batch. Call GET /question first.",
            });
        }

        const idx = progress.currentQuestionIndex;

        if (idx >= progress.currentLevelQuestions.length) {
            return res.status(400).json({
                success: false,
                message: "This level is already fully answered — submit it with POST /submit-level.",
            });
        }

        progress.currentAnswers[idx] = (answer || "").trim();
        progress.currentQuestionIndex += 1;

        const allAnswered = progress.currentQuestionIndex >= progress.currentLevelQuestions.length;

        await progress.save();

        res.status(200).json({
            success: true,
            questionIndex: idx,
            nextQuestionIndex: progress.currentQuestionIndex,
            totalQuestions: progress.currentLevelQuestions.length,
            allAnswered,
        });

    } catch (error) {
        console.error("Submit interview answer error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to save answer",
        });
    }
};







export const submitLevel = async (req, res) => {
    try {
        const progress = await getOrCreateProgress(req.user._id);

        if (!progress.currentLevelQuestions || progress.currentLevelQuestions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No active question batch to grade.",
            });
        }

        const unanswered = progress.currentAnswers.some((a) => !a);

        if (unanswered) {
            return res.status(400).json({
                success: false,
                message: `Please answer all ${progress.currentLevelQuestions.length} questions before submitting.`,
            });
        }

        const qaPairs = progress.currentLevelQuestions.map((q, i) => ({
            question: q.question,
            answer: progress.currentAnswers[i],
            type: q.type,
        }));

        const { results, overallScore, passed } = await evaluateAnswerBatch(qaPairs);

        progress.currentLevelQuestions.forEach((q, i) => {
            progress.history.push({
                level: q.level,
                difficulty: q.difficulty,
                type: q.type,
                topic: q.topic,
                question: q.question,
                answer: progress.currentAnswers[i],
                accuracy: results[i].accuracy,
                feedback: results[i].feedback,
                passed: results[i].passed,
            });
        });

        let levelUp = false;
        let interviewFinished = false;

        if (passed) {
            if (progress.currentLevel < 100) {
                progress.currentLevel += 1;
                levelUp = true;
            } else {
                
                interviewFinished = true;
            }
        }

        
        
        progress.currentLevelQuestions = [];
        progress.currentAnswers = [];
        progress.currentQuestionIndex = 0;

        await progress.save();

        let savedResult = null;

        if (interviewFinished) {
            savedResult = await finalizeInterview(req.user._id, progress);
        }

        res.status(200).json({
            success: true,
            overallScore,
            passed,
            passThreshold: PASS_THRESHOLD,
            results,
            levelUp,
            currentLevel: progress.currentLevel,
            interviewFinished,
            resultId: savedResult?._id || null,
        });

    } catch (error) {
        console.error("Submit interview level error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to grade level",
        });
    }
};





export const completeInterview = async (req, res) => {
    try {
        const progress = await getOrCreateProgress(req.user._id);

        if (progress.history.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No graded questions to complete yet.",
            });
        }

        const savedResult = await finalizeInterview(req.user._id, progress);

        res.status(200).json({
            success: true,
            resultId: savedResult._id,
        });

    } catch (error) {
        console.error("Complete interview error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to complete interview",
        });
    }
};



const finalizeInterview = async (userId, progress) => {
    
    
    
    const graded = progress.history.filter((h) => h.accuracy !== null);

    const totalAttempted = graded.length;
    const totalPassed = graded.filter((h) => h.passed).length;
    const averageAccuracy =
        totalAttempted > 0
            ? graded.reduce((sum, h) => sum + h.accuracy, 0) / totalAttempted
            : 0;

    
    
    const levelResults = [];
    const seenLevels = new Set();

    for (const h of progress.history) {
        if (seenLevels.has(h.level)) continue;
        seenLevels.add(h.level);

        const levelAttempts = graded.filter((g) => g.level === h.level);
        const levelAvg =
            levelAttempts.length > 0
                ? levelAttempts.reduce((sum, g) => sum + g.accuracy, 0) / levelAttempts.length
                : 0;

        levelResults.push({
            level: h.level,
            overallScore: Math.round(levelAvg * 100) / 100,
            passed: levelAttempts.length > 0 && levelAttempts.every((g) => g.passed),
        });
    }

    const result = await InterviewResult.create({
        userId,
        finalLevel: progress.currentLevel,
        questionsAttempted: totalAttempted,
        questionsPassed: totalPassed,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        levelResults,
        history: progress.history,
        completedAt: new Date(),
    });

    
    progress.currentLevel = 1;
    progress.currentLevelQuestions = [];
    progress.currentAnswers = [];
    progress.currentQuestionIndex = 0;
    progress.history = [];
    await progress.save();

    return result;
};





export const getProgress = async (req, res) => {
    try {
        const progress = await getOrCreateProgress(req.user._id);

        res.status(200).json({
            success: true,
            currentLevel: progress.currentLevel,
            passThreshold: PASS_THRESHOLD,
            questionIndex: progress.currentQuestionIndex,
            totalQuestions: progress.currentLevelQuestions.length,
            history: progress.history,
        });

    } catch (error) {
        console.error("Get interview progress error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get interview progress",
        });
    }
};





export const getResults = async (req, res) => {
    try {
        const results = await InterviewResult.find({ userId: req.user._id })
            .sort({ completedAt: -1 })
            .select("-history.answer -history.question"); 

        res.status(200).json({
            success: true,
            results,
        });

    } catch (error) {
        console.error("Get interview results error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get interview results",
        });
    }
};

export const getResultById = async (req, res) => {
    try {
        const result = await InterviewResult.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Interview result not found",
            });
        }

        res.status(200).json({
            success: true,
            result,
        });

    } catch (error) {
        console.error("Get interview result error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get interview result",
        });
    }
};