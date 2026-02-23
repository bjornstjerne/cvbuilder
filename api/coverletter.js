const { sanitizeInput, checkRateLimit, callClaude } = require('./utils');

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
        if (!checkRateLimit(req, res, 60, 60)) return;

        const { cvText: rawCvText, jdText: rawJdText, model: rawModel } = req.body || {};
        const cvText = sanitizeInput(rawCvText, 10000);
        const jdText = sanitizeInput(rawJdText, 5000);
        const model = sanitizeInput(rawModel, 100) || 'claude-3-haiku-20240307';

        if (!cvText) {
            return res.status(400).json({ error: 'CV text is required' });
        }

        const prompt = `You are an expert cover letter writer. Based on the following CV${jdText ? ' and job description' : ''}, write a compelling, professional cover letter.
        
The cover letter should:
- Be 3-4 paragraphs
- Highlight relevant experience from the CV
- Show enthusiasm for the role
- Be professional but personable
- Include a strong opening and closing

CV TEXT:
${cvText.substring(0, 10000)}

${jdText ? `JOB DESCRIPTION:\n${jdText.substring(0, 5000)}` : ''}

Return ONLY the cover letter text, no explanations. Do not include placeholder names or addresses - leave those blank for the user to fill in.`;

        const coverLetter = await callClaude(prompt, model);
        res.json({ coverLetter });

    } catch (error) {
        console.error('Cover letter error:', error);
        res.status(500).json({
            error: 'Cover letter generation failed',
            message: error.message
        });
    }
};
