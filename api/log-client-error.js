const { sanitizeInput, checkRateLimit } = require('./utils');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-Requested-With, Accept, Content-Type'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!checkRateLimit(req, res, 30, 60)) return;

    try {
        const body = req.body || {};
        const event = {
            type: sanitizeInput(body.type, 40) || 'window-error',
            message: sanitizeInput(body.message, 240),
            source: sanitizeInput(body.source, 240),
            line: Number(body.line) || 0,
            col: Number(body.col) || 0,
            stack: sanitizeInput(body.stack, 1200),
            page: sanitizeInput(body.page, 120),
            build: sanitizeInput(body.build, 40),
            userAgent: sanitizeInput(body.userAgent, 220),
            timestamp: new Date().toISOString(),
            ipHint: sanitizeInput(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '', 120)
        };

        // Log in structured JSON so Vercel log drains/search work cleanly.
        console.error('[ClientError]', JSON.stringify(event));
        res.status(202).json({ ok: true });
    } catch (error) {
        console.error('Client error log endpoint failure:', error);
        res.status(500).json({ error: 'Could not log client error' });
    }
};
