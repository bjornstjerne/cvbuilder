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

        const { sectionText: rawSectionText, sectionTitle: rawSectionTitle, model: rawModel } = req.body || {};
        const sectionText = sanitizeInput(rawSectionText, 2000);
        const sectionTitle = sanitizeInput(rawSectionTitle, 200);
        const model = sanitizeInput(rawModel, 100) || 'claude-3-5-haiku-20241022';

        const prompt = `You are an expert CV writer. Optimize the following CV section titled "${sectionTitle}".

ORIGINAL TEXT:
${sectionText}

Improve it by:
- Using stronger action verbs
- Quantifying achievements where possible
- Making it more concise and impactful
- Improving clarity and readability
- Maintaining the same general structure and format

Return ONLY the optimized text, no explanations or comments.`;

        const optimizedText = await callClaude(prompt, model);
        res.json({ optimizedText: optimizedText.trim() });

    } catch (error) {
        console.error('Optimization error:', error);
        res.status(500).json({
            error: 'Section optimization failed',
            message: error.message
        });
    }
};
