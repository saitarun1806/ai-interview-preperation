import { GoogleGenAI } from "@google/genai";














const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";

const keys = rawKeys
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

if (keys.length === 0) {
    throw new Error(
        "No Gemini API key configured. Set GEMINI_API_KEYS (comma-separated) or GEMINI_API_KEY in server/.env."
    );
}


const clients = keys.map(
    (apiKey) =>
        new GoogleGenAI({
            apiKey,
            httpOptions: { apiVersion: "v1beta" },
        })
);

const keyCount = clients.length;


let cursor = 0;




const isRetryableStatus = (err) => {
    const status =
        err?.status ??
        err?.error?.code ??
        err?.response?.status ??
        (typeof err?.message === "string" && err.message.includes("429") ? 429 : undefined);

    return status === 429 || status === 500 || status === 503 || status === undefined;
};





const generateContent = async (params) => {
    const startIndex = cursor;
    cursor = (cursor + 1) % clients.length;

    let lastErr;

    for (let attempt = 0; attempt < clients.length; attempt++) {
        const clientIndex = (startIndex + attempt) % clients.length;

        try {
            return await clients[clientIndex].models.generateContent(params);
        } catch (err) {
            lastErr = err;

            if (!isRetryableStatus(err)) {
                throw err;
            }

            console.warn(
                `Gemini key #${clientIndex + 1}/${clients.length} failed ` +
                    `(${err?.status || err?.message || "unknown error"}) — trying next key…`
            );
        }
    }

    throw lastErr;
};

export { generateContent, keyCount };