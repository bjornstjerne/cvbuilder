const rateMap = new Map();

function sanitizeInput(input, maxLen = 10000) {
    if (!input) return '';
    let s = String(input);
    // Remove control characters except common whitespace, replace with space
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');
    // Trim and limit length
    return s.trim().slice(0, maxLen);
}

function getIP(req) {
    return req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(req, res, limit = 60, windowSec = 60) {
    try {
        const ip = getIP(req);
        const now = Date.now();
        const entry = rateMap.get(ip) || { count: 0, reset: now + windowSec * 1000 };
        if (now > entry.reset) {
            entry.count = 0;
            entry.reset = now + windowSec * 1000;
        }
        entry.count += 1;
        rateMap.set(ip, entry);
        if (entry.count > limit) {
            res.status(429).json({ error: 'Too many requests. Please slow down.' });
            return false;
        }
        // Set some rate-limit headers for clients
        res.setHeader('X-RateLimit-Limit', String(limit));
        res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
        res.setHeader('X-RateLimit-Reset', String(Math.floor(entry.reset / 1000)));
        return true;
    } catch (e) {
        // If rate limiting fails for some reason, allow the request
        return true;
    }
}

/**
 * Call the Anthropic Claude API with a prompt.
 * @param {string} prompt - The user prompt
 * @param {string} model - Claude model ID (e.g. 'claude-3-5-haiku-20241022')
 * @param {number} maxTokens - Max output tokens
 * @returns {Promise<string>} - The text response
 */
async function callClaude(prompt, model = 'claude-3-haiku-20240307', maxTokens = 2048) {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
        throw new Error('CLAUDE_API_KEY not configured on server');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: model,
            max_tokens: maxTokens,
            messages: [
                { role: 'user', content: prompt }
            ]
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message || 'Claude API error');
    }

    if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Unexpected response format from Claude API');
    }

    return data.content[0].text;
}

module.exports = { sanitizeInput, checkRateLimit, callClaude };
