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

        const coverLetter = data.candidates[0].content.parts[0].text;
        res.json({ coverLetter });

    } catch (error) {
        console.error('Cover letter error:', error);
        res.status(500).json({
            error: 'Cover letter generation failed',
            message: error.message
        });
    }
};
