const { checkRateLimit } = require('./utils');

// Claude models available - hardcoded since Anthropic doesn't have a simple public list endpoint
const CLAUDE_MODELS = [
    {
        name: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku',
        description: 'Fast and capable model for daily tasks'
    }
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (!checkRateLimit(req, res, 120, 60)) return;

        const apiKey = process.env.CLAUDE_API_KEY;
        res.json({
            models: CLAUDE_MODELS,
            ready: Boolean(apiKey),
            message: apiKey
                ? 'Model list loaded'
                : 'API key not configured. Model list available, but analysis requests will fail until configured.'
        });
    } catch (error) {
        console.error('Error listing models:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
};
