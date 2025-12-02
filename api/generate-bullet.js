const { sanitizeInput, checkRateLimit } = require('./utils');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (!checkRateLimit(req, res, 60, 60)) return;

        const { keyword: rawKeyword } = req.body || {};
        const keyword = sanitizeInput(rawKeyword, 200);
        const apiKey = process.env.GEMINI_API_KEY;
        const modelName = 'gemini-2.0-flash-lite-001';

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        const prompt = `
    Write a single, strong, professional resume bullet point demonstrating the skill: "${keyword}".
    Use action verbs. Do not include any introductory text. Just the bullet point.
    Example for "Python": "Developed automated data processing scripts using Python, reducing manual workload by 40%."
    `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
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

        const bulletPoint = data.candidates[0].content.parts[0].text.trim();
        res.json({ bulletPoint });

    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({
            error: 'Bullet point generation failed',
            message: error.message
        });
    }
};
