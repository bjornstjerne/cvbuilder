module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();

        const models = data.models
            .filter(m => m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => ({
                name: m.name,
                displayName: m.displayName,
                description: m.description
            }));

        res.json({ models });
    } catch (error) {
        console.error('Error listing models:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
};
