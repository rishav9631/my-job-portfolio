const axios = require('axios');
const { getConfigInternal } = require('./configController');
require('dotenv').config();

exports.runGemini = async (req, res) => {
    try {
        // Get dynamic config from MongoDB (with cache)
        const config = await getConfigInternal();
        const GEMINI_API_KEY_MAIN = config.geminiApiKey || process.env.GEMINI_API_KEY;
        const GEMINI_URL_MAIN = config.geminiApiUrl || process.env.GEMINI_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, message: "Prompt is required" });
        }

        const geminiRes = await axios.post(
            `${GEMINI_URL_MAIN}?key=${GEMINI_API_KEY_MAIN}`,
            {
                contents: [
                    { parts: [{ text: prompt }] }
                ]
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        // Extracted text response from Gemini API
        const textResponse = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        res.json({ success: true, response: textResponse, raw: geminiRes.data });
    } catch (err) {
        console.error("Gemini API Error:", err.message);
        res.status(500).json({ success: false, error: err.message, details: err.response?.data });
    }
};
