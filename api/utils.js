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

module.exports = { sanitizeInput, checkRateLimit };
