const { sanitizeInput, checkRateLimit, callClaude } = require('./utils');

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

        const { keyword: rawKeyword, model: rawModel } = req.body || {};
        const keyword = sanitizeInput(rawKeyword, 200);
        const model = sanitizeInput(rawModel, 100) || 'claude-3-5-haiku-20241022';

        const prompt = `Write a single, strong, professional resume bullet point demonstrating the skill: "${keyword}".
Use action verbs. Do not include any introductory text. Just the bullet point.
Example for "Python": "Developed automated data processing scripts using Python, reducing manual workload by 40%."`;

        const bulletPoint = await callClaude(prompt, model);
        res.json({ bulletPoint: bulletPoint.trim() });

    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({
            error: 'Bullet point generation failed',
            message: error.message
        });
    }
};
