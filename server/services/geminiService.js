import { generateContent } from "./geminiClient.js";

const askGemini = async (prompt) => {
    try {
        const response = await generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (err) {
        console.error("Error in askGemini:", err);
        throw err;
    }
};





const RESUME_PARSE_PROMPT = `You are a resume parser. Read the resume text below and return ONLY a valid JSON object (no markdown, no code fences, no explanation) with this exact shape:

{
  "name": string,
  "email": string,
  "phone": string,
  "summary": string,
  "skills": string[],
  "education": [
    { "degree": string, "institution": string, "year": string }
  ],
  "experience": [
    { "title": string, "company": string, "duration": string, "description": string }
  ],
  "projects": [
    { "name": string, "description": string, "technologies": string[] }
  ]
}

Rules:
- If a field cannot be found, use an empty string "" (or empty array [] for lists) — never null, never omit the key.
- "skills" should be a flat list of individual skill names, not sentences.
- "experience" should be ordered most recent first if determinable.
- "projects" should capture standalone/personal/academic projects listed separately from work experience. "technologies" is a flat list of tools/languages/frameworks used in that project.
- Return ONLY the JSON object, nothing else.

Resume text:
"""
{{RESUME_TEXT}}
"""`;

const parseResumeData = async (resumeText) => {
    const prompt = RESUME_PARSE_PROMPT.replace(
        "{{RESUME_TEXT}}",
        resumeText.slice(0, 15000) 
    );

    const response = await generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
    });

    const rawText = response.text.trim();

    
    const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

    let parsed;

    try {
        parsed = JSON.parse(cleaned);
    } catch (err) {
        console.error("Failed to parse Gemini JSON output:", cleaned);
        throw new Error("Gemini returned an unparseable response.");
    }

    return {
        name: parsed.name || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        summary: parsed.summary || "",
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        education: Array.isArray(parsed.education) ? parsed.education : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    };
};

export { askGemini, parseResumeData };