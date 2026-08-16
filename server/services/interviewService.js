import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateContent } from "./geminiClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PASS_THRESHOLD = 91;





const INTRODUCTION_QUESTION =
    "Tell me about yourself — walk me through your background, your key skills, and what you've been working on recently.";





const levelsPath = path.join(__dirname, "../data/interviewLevels.json");
const LEVELS = JSON.parse(fs.readFileSync(levelsPath, "utf-8"));

const getLevelConfig = (level) => {
    const config = LEVELS.find((l) => l.level === level);

    if (!config) {
        throw new Error(`No prompt configured for level ${level}`);
    }

    return config;
};









const pickTopicForLevel = (skills, projects, level) => {
    const hasProjects = projects && projects.length > 0;
    const hasSkills = skills && skills.length > 0;

    if (!hasSkills && !hasProjects) {
        throw new Error(
            "No skills or projects found. Please upload a resume before starting the interview."
        );
    }

    const useProject = hasProjects && level % 2 === 0;

    if (useProject) {
        const projectIndex = Math.floor((level - 1) / 2) % projects.length;
        const project = projects[projectIndex];

        const techList =
            Array.isArray(project.technologies) && project.technologies.length > 0
                ? project.technologies.join(", ")
                : "not specified";

        return {
            type: "project",
            topic: project.name || "Untitled project",
            subject: `their project "${project.name || "Untitled project"}": ${
                project.description || "no description provided"
            } (tech stack: ${techList})`,
        };
    }

    
    const skillPool = hasSkills ? skills : projects.map((p) => p.name);
    const skillIndex = Math.floor((level - 1) / (hasProjects ? 2 : 1)) % skillPool.length;
    const skill = skillPool[skillIndex];

    return {
        type: "skill",
        topic: skill,
        subject: skill,
    };
};

const makeProjectTopic = (project) => {
    const techList =
        Array.isArray(project.technologies) && project.technologies.length > 0
            ? project.technologies.join(", ")
            : "not specified";

    return {
        type: "project",
        topic: project.name || "Untitled project",
        subject: `their project "${project.name || "Untitled project"}": ${
            project.description || "no description provided"
        } (tech stack: ${techList})`,
    };
};

const makeSkillTopic = (skill) => ({ type: "skill", topic: skill, subject: skill });









const buildTopicsForBatch = (skills, projects, count) => {
    const hasProjects = projects && projects.length > 0;
    const hasSkills = skills && skills.length > 0;

    if (!hasSkills && !hasProjects) {
        throw new Error(
            "No skills or projects found. Please upload a resume before starting the interview."
        );
    }

    const skillPool = hasSkills ? skills : projects.map((p) => p.name);
    const topics = [];

    
    if (hasProjects) {
        for (const project of projects) {
            if (topics.length >= count) break;
            topics.push(makeProjectTopic(project));
        }
    }

    
    
    let skillCursor = 0;
    let projectCursor = 0;
    let nextIsSkill = true;

    while (topics.length < count) {
        if (nextIsSkill && skillPool.length > 0) {
            topics.push(makeSkillTopic(skillPool[skillCursor % skillPool.length]));
            skillCursor++;
        } else if (hasProjects) {
            topics.push(makeProjectTopic(projects[projectCursor % projects.length]));
            projectCursor++;
        } else {
            topics.push(makeSkillTopic(skillPool[skillCursor % skillPool.length]));
            skillCursor++;
        }
        nextIsSkill = !nextIsSkill;
    }

    return topics.slice(0, count);
};





const extractStyleGuidance = (promptTemplate) =>
    promptTemplate
        .replace(/\{skill\}/g, "[TOPIC]")
        .replace(/Return ONLY the interview question text[^]*$/i, "")
        .trim();





const generateQuestion = async (level, skills, projects) => {
    const levelConfig = getLevelConfig(level);
    const { type, topic, subject } = pickTopicForLevel(skills, projects, level);

    const prompt = levelConfig.promptTemplate.replace("{skill}", subject);

    const response = await generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
    });

    const question = response.text.trim();

    return {
        level,
        difficulty: levelConfig.difficulty,
        type,
        topic,
        question,
    };
};





const stripJsonFences = (rawText) =>
    rawText
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

/**
 * Generates `count` questions (10-20) for a single level in ONE Gemini
 * call, instead of firing off `count` separate calls. Each question is
 * still tied to its own topic (mixing skills + projects, with every
 * project in the resume guaranteed a question — see buildTopicsForBatch).
 *
 * The first question in every batch is always the fixed
 * INTRODUCTION_QUESTION ("tell me about yourself...") — it's asked at
 * every level, not just the first one — so only `count - 1` topic-based
 * questions are generated by Gemini to make room for it.
 */
const generateQuestionBatch = async (level, skills, projects, count = 10) => {
    if (count < 2 || count > 20) {
        throw new Error("count must be between 2 and 20 (one slot is reserved for the introduction question).");
    }

    const levelConfig = getLevelConfig(level);
    const generatedCount = count - 1;
    const topics = buildTopicsForBatch(skills, projects, generatedCount);
    const styleGuidance = extractStyleGuidance(levelConfig.promptTemplate);

    const topicsList = topics
        .map((t, i) => `${i + 1}. ${t.subject}`)
        .join("\n");

    const prompt = `You are a technical interviewer generating a batch of interview questions for a candidate.

Difficulty level: "${levelConfig.difficulty}"
Style/difficulty guidance to apply to EVERY question below (with [TOPIC] mentally replaced by that question's actual topic):
"${styleGuidance}"

Generate exactly ${generatedCount} questions — one per topic listed below, in the same order. Each question must be about its paired topic and follow the style guidance above. Vary the phrasing and sentence structure across the batch so it doesn't read like a template repeated ${generatedCount} times.

Topics, in order:
${topicsList}

Return ONLY a valid JSON array (no markdown, no code fences, no explanation) with exactly ${generatedCount} elements, each shaped as:
{ "question": string }

The array order MUST match the topic order above (element 1 = topic 1, element 2 = topic 2, etc).`;

    const response = await generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
    });

    const cleaned = stripJsonFences(response.text);

    let parsed;

    try {
        parsed = JSON.parse(cleaned);
    } catch (err) {
        console.error("Failed to parse Gemini batch question output:", cleaned);
        throw new Error("Gemini returned an unparseable batch of questions.");
    }

    if (!Array.isArray(parsed) || parsed.length !== generatedCount) {
        console.error("Unexpected batch question shape:", parsed);
        throw new Error(
            `Expected an array of ${generatedCount} questions from Gemini, got ${
                Array.isArray(parsed) ? parsed.length : typeof parsed
            }.`
        );
    }

    const generated = parsed.map((item, i) => ({
        level,
        difficulty: levelConfig.difficulty,
        type: topics[i].type,
        topic: topics[i].topic,
        question: (item.question || "").trim(),
    }));

    return [
        {
            level,
            difficulty: levelConfig.difficulty,
            type: "introduction",
            topic: "Introduction",
            question: INTRODUCTION_QUESTION,
        },
        ...generated,
    ];
};

const EVAL_PROMPT = `You are a strict technical interviewer grading a candidate's spoken/written answer.

Question asked:
"""
{{QUESTION}}
"""

Candidate's answer:
"""
{{ANSWER}}
"""

Grade the answer for technical correctness, completeness, and clarity. Return ONLY a valid JSON object (no markdown, no code fences) in this exact shape:

{
  "accuracy": number,   
  "feedback": string    
}

If the answer is empty, off-topic, or shows no understanding, accuracy should be low (0-20). Be strict — do not round up out of politeness.`;

const evaluateAnswer = async (question, answer) => {
    const prompt = EVAL_PROMPT
        .replace("{{QUESTION}}", question)
        .replace("{{ANSWER}}", answer || "(no answer provided)");

    const response = await generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
    });

    const cleaned = stripJsonFences(response.text);

    let parsed;

    try {
        parsed = JSON.parse(cleaned);
    } catch (err) {
        console.error("Failed to parse Gemini evaluation output:", cleaned);
        throw new Error("Gemini returned an unparseable evaluation.");
    }

    const accuracy = Math.max(0, Math.min(100, Number(parsed.accuracy) || 0));
    const feedback = parsed.feedback || "";
    const passed = accuracy >= PASS_THRESHOLD;

    return { accuracy, feedback, passed };
};

const evaluateAnswerBatch = async (qaPairs) => {
    if (!Array.isArray(qaPairs) || qaPairs.length === 0) {
        throw new Error("qaPairs must be a non-empty array of { question, answer, type }.");
    }

    const results = new Array(qaPairs.length).fill(null);

    const gradable = [];
    const gradableIndexes = [];

    qaPairs.forEach((qa, i) => {
        if (qa.type === "introduction") {
            results[i] = {
                accuracy: null,
                feedback: "Not scored — introductory question.",
                passed: null,
                skipped: true,
            };
        } else {
            gradable.push(qa);
            gradableIndexes.push(i);
        }
    });

    if (gradable.length === 0) {
        return { results, overallScore: 0, passed: false };
    }

    const count = gradable.length;

    const pairsBlock = gradable
        .map(
            (qa, i) => `--- Pair ${i + 1} ---
Question: """${qa.question}"""
Answer: """${qa.answer || "(no answer provided)"}"""`
        )
        .join("\n\n");

    const prompt = `You are a strict technical interviewer grading a full round of ${count} question-and-answer pairs from the same interview level.

Grade each answer independently for technical correctness, completeness, and clarity. Be strict — do not round up out of politeness. If an answer is empty, off-topic, or shows no understanding, its accuracy should be low (0-20).

${pairsBlock}

After grading each pair individually, also give ONE holistic "overallScore" (0-100) for the candidate's performance across this entire batch. Do not just average the per-question scores — weigh consistency across answers, depth of understanding, and whether weak answers were concentrated or scattered, the way a human interviewer deciding whether to advance the candidate would.

Return ONLY a valid JSON object (no markdown, no code fences, no explanation) with this exact shape:

{
  "results": [
    { "accuracy": number, "feedback": string }
  ],
  "overallScore": number
}

"results" must have exactly ${count} entries, in the same order as the pairs above (entry 1 = Pair 1, entry 2 = Pair 2, etc).`;

    const response = await generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
    });

    const cleaned = stripJsonFences(response.text);

    let parsed;

    try {
        parsed = JSON.parse(cleaned);
    } catch (err) {
        console.error("Failed to parse Gemini batch evaluation output:", cleaned);
        throw new Error("Gemini returned an unparseable batch evaluation.");
    }

    if (!Array.isArray(parsed.results) || parsed.results.length !== count) {
        console.error("Unexpected batch evaluation shape:", parsed);
        throw new Error(
            `Expected ${count} results from Gemini, got ${
                Array.isArray(parsed.results) ? parsed.results.length : typeof parsed.results
            }.`
        );
    }

    parsed.results.forEach((r, i) => {
        const accuracy = Math.max(0, Math.min(100, Number(r.accuracy) || 0));
        results[gradableIndexes[i]] = {
            accuracy,
            feedback: r.feedback || "",
            passed: accuracy >= PASS_THRESHOLD,
        };
    });

    const overallScore = Math.max(0, Math.min(100, Number(parsed.overallScore) || 0));

    return {
        results,
        overallScore,
        passed: overallScore >= PASS_THRESHOLD,
    };
};

export {
    LEVELS,
    PASS_THRESHOLD,
    INTRODUCTION_QUESTION,
    getLevelConfig,
    pickTopicForLevel,
    buildTopicsForBatch,
    generateQuestion,
    generateQuestionBatch,
    evaluateAnswer,
    evaluateAnswerBatch,
};