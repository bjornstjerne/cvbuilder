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
        const { sectionText, sectionTitle } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

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

        const optimizedText = data.candidates[0].content.parts[0].text.trim();
        res.json({ optimizedText });

    } catch (error) {
        console.error('Optimization error:', error);
        res.status(500).json({
            error: 'Section optimization failed',
            message: error.message
        });
    }
};
