const { sanitizeInput, checkRateLimit } = require('./utils');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Basic rate limiting per IP
        if (!checkRateLimit(req, res, 60, 60)) return;

        const { cvText: rawCvText, jdText: rawJdText } = req.body || {};
        const cvText = sanitizeInput(rawCvText, 10000);
        const jdText = sanitizeInput(rawJdText, 5000);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        if (!cvText) {
            return res.status(400).json({ error: 'CV text is required' });
        }

        const prompt = `
        You are an expert CV analyzer and career coach. Analyze the following CV text and Job Description (if provided).
        
        CV TEXT:
        ${cvText.substring(0, 10000)}

        JOB DESCRIPTION:
        ${jdText ? jdText.substring(0, 5000) : "Not provided"}

        Provide a response in strict JSON format with the following structure:
        {
            "score": <number 0-100>,
            "jdScore": <number 0-100, or 0 if no JD>,
            "summary": "<brief summary of the candidate>",
            "strengths": ["<strength 1>", "<strength 2>", ...],
            "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
            "suggestions": ["<specific actionable suggestion 1>", "<suggestion 2>", ...],
            "missingKeywords": ["<keyword 1>", "<keyword 2>", ...],
            "interviewQuestions": [
                {"type": "behavioral", "text": "<question 1>"},
                {"type": "technical", "text": "<question 2>"},
                {"type": "situational", "text": "<question 3>"}
            ]
        }
        `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-001:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonText);

        res.json(result);

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message
        });
    }
};
