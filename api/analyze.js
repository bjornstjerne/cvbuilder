const { sanitizeInput, checkRateLimit, callClaude, parseClaudeJson } = require('./utils');

function normalizeSuggestion(item) {
    if (!item) return null;

    if (typeof item === 'string') {
        return {
            title: 'Improve this area',
            recommendation: item,
            evidence: 'No direct evidence snippet was returned.',
            priority: 'medium'
        };
    }

    if (typeof item !== 'object') return null;

    const title = sanitizeInput(item.title || item.issue || 'Improve this area', 120);
    const recommendation = sanitizeInput(item.recommendation || item.action || item.text || '', 400);
    const evidence = sanitizeInput(item.evidence || item.cvEvidence || item.snippet || '', 240);
    const rawPriority = sanitizeInput(item.priority || 'medium', 20).toLowerCase();
    const priority = ['high', 'medium', 'low'].includes(rawPriority) ? rawPriority : 'medium';

    if (!recommendation) return null;

    return {
        title,
        recommendation,
        evidence: evidence || 'No direct evidence snippet was returned.',
        priority
    };
}

function normalizeResult(result) {
    const normalized = { ...result };
    const incomingSuggestions = Array.isArray(result.suggestions) ? result.suggestions : [];
    const incomingKeywords = Array.isArray(result.missingKeywords) ? result.missingKeywords : [];
    const incomingQuestions = Array.isArray(result.interviewQuestions) ? result.interviewQuestions : [];

    const toScore = (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return 0;
        return Math.max(0, Math.min(100, Math.round(n)));
    };

    normalized.suggestions = incomingSuggestions
        .map(normalizeSuggestion)
        .filter(Boolean)
        .slice(0, 8);

    normalized.score = toScore(result.score);
    normalized.jdScore = toScore(result.jdScore);
    normalized.missingKeywords = incomingKeywords
        .map((kw) => sanitizeInput(kw, 64))
        .filter(Boolean)
        .slice(0, 25);
    normalized.interviewQuestions = incomingQuestions
        .map((q) => ({
            type: sanitizeInput((q && q.type) || 'general', 40).toLowerCase() || 'general',
            text: sanitizeInput((q && q.text) || '', 280)
        }))
        .filter((q) => q.text);

    return normalized;
}

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
        // Basic rate limiting per IP
        if (!checkRateLimit(req, res, 60, 60)) return;

        const { cvText: rawCvText, jdText: rawJdText, model: rawModel } = req.body || {};
        const cvText = sanitizeInput(rawCvText, 10000);
        const jdText = sanitizeInput(rawJdText, 5000);
        const model = sanitizeInput(rawModel, 100) || 'claude-3-haiku-20240307';

        if (!cvText) {
            return res.status(400).json({ error: 'CV text is required' });
        }

        const prompt = `You are an expert CV analyzer and career coach. Analyze the following CV text and Job Description (if provided).
        
CV TEXT:
${cvText.substring(0, 10000)}

JOB DESCRIPTION:
${jdText ? jdText.substring(0, 5000) : 'Not provided'}

Provide a response in strict JSON format with the following structure:
{
    "score": <number 0-100>,
    "jdScore": <number 0-100, or 0 if no JD>,
    "summary": "<brief summary of the candidate>",
    "strengths": ["<strength 1>", "<strength 2>", ...],
    "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
    "suggestions": [
        {
            "title": "<short issue label>",
            "recommendation": "<specific actionable change>",
            "evidence": "<short direct snippet from CV or JD that supports this recommendation>",
            "priority": "<high|medium|low>"
        }
    ],
    "missingKeywords": ["<keyword 1>", "<keyword 2>", ...],
    "interviewQuestions": [
        {"type": "behavioral", "text": "<question 1>"},
        {"type": "technical", "text": "<question 2>"},
        {"type": "situational", "text": "<question 3>"}
    ]
}

Rules:
- Provide 3 to 6 suggestions.
- Evidence must quote a concrete phrase or line from the provided CV or JD.
- Keep evidence under 160 characters.
- Prioritize suggestions by impact on interview and ATS outcomes.

Respond with ONLY the JSON object, no markdown fences or additional text.`;

        const rawText = await callClaude(prompt, model);
        const parsed = parseClaudeJson(rawText);
        const result = normalizeResult(parsed);

        res.json(result);

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message
        });
    }
};
