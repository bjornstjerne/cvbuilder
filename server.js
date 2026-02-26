const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.')); // Serve static files from current directory

const crypto = require('crypto');

// Simple in-memory cache
const requestCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Claude model configuration
// Using claude-opus-4-1 which is the latest and most capable model available
const CLAUDE_MODEL = 'claude-opus-4-1-20250805';

// Request throttling to prevent rate limits
const requestQueue = [];
let isProcessing = false;
const REQUEST_DELAY = 1000; // 1 second between API calls

async function queuedAPICall(callFn) {
    return new Promise((resolve, reject) => {
        requestQueue.push({ callFn, resolve, reject });
        processQueue();
    });
}

async function processQueue() {
    if (isProcessing || requestQueue.length === 0) return;

    isProcessing = true;
    const { callFn, resolve, reject } = requestQueue.shift();

    try {
        const result = await callFn();
        resolve(result);
    } catch (error) {
        reject(error);
    } finally {
        setTimeout(() => {
            isProcessing = false;
            processQueue();
        }, REQUEST_DELAY);
    }
}

// Helper function to call Claude API
async function callClaudeAPI(prompt, imageData, apiKey, isVisualAnalysis) {
    console.log(`\n=== Claude API Call ===`);
    console.log(`Model: ${CLAUDE_MODEL}`);
    console.log(`Prompt length: ${prompt.length} chars`);

    // Note: Claude API doesn't easily support image uploads in free tier
    // We focus on text analysis
    if (isVisualAnalysis && imageData && imageData.length > 0) {
        console.log('Note: Using text analysis only (Claude API requires more setup for images)');
    }

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            console.log(`Attempt ${attempt + 1}/3...`);

            const response = await fetch(
                'https://api.anthropic.com/v1/messages',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: CLAUDE_MODEL,
                        max_tokens: 2000,
                        messages: [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ]
                    })
                }
            );

            console.log(`Response status: ${response.status}`);
            const data = await response.json();
            console.log(`Response received:`, JSON.stringify(data).substring(0, 200));

            if (data.error) {
                const errorMsg = data.error.message || JSON.stringify(data.error);
                console.log(`API Error: ${errorMsg}`);

                // Rate limit error
                if (data.error.type === 'rate_limit_error' || errorMsg.includes('rate limit')) {
                    console.log(`Rate limited, retrying...`);
                    if (attempt < 2) {
                        const waitTime = Math.pow(2, attempt + 1) * 1000;
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }
                    throw new Error('Rate limited. Please try again later.');
                }

                // Authentication error
                if (data.error.type === 'authentication_error') {
                    throw new Error('Invalid API key. Please check your Claude API key.');
                }

                // Other error
                throw new Error(data.error.message);
            }

            // Success!
            console.log('Claude API call successful');
            return {
                data: data,
                usedModel: CLAUDE_MODEL
            };

        } catch (error) {
            if (attempt < 2) {
                const waitTime = Math.pow(2, attempt + 1) * 1000;
                console.log(`Error on attempt ${attempt + 1}. Retrying in ${waitTime}ms: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                throw error;
            }
        }
    }
}

// Analyze endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const { cvText, jdText, model, cvImages } = req.body;
        const apiKey = process.env.CLAUDE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Claude API key not configured on server' });
        }

        if (!cvText && (!cvImages || cvImages.length === 0)) {
            return res.status(400).json({ error: 'CV text or images are required' });
        }

        // Create a cache key based on inputs
        const cacheKey = crypto
            .createHash('md5')
            .update(JSON.stringify({ cvText, jdText, hasImages: !!cvImages }))
            .digest('hex');

        // Check cache
        if (requestCache.has(cacheKey)) {
            const cached = requestCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                console.log('Serving from cache:', cacheKey);
                return res.json(cached.data);
            }
            requestCache.delete(cacheKey);
        }

        // Build the prompt - optimized for rate limits (shorter to save tokens)
        const isVisualAnalysis = cvImages && cvImages.length > 0;
        const prompt = `Analyze this CV and provide ratings/feedback in JSON.
        
${jdText ? `Job Description (first 1500 chars):\n${jdText.substring(0, 1500)}\n\n` : ""}
CV Text (first 2000 chars):\n${cvText.substring(0, 2000)}

Provide ONLY this JSON (no other text):
{
  "score": <0-100>,
  "jdScore": <0-100 or 0>,
  "summary": "<brief>",
  "strengths": ["<s1>", "<s2>"],
  "weaknesses": ["<w1>", "<w2>"],
  "suggestions": ["<suggest1>", "<suggest2>"],
  "missingKeywords": ["<kw1>", "<kw2>"],
  "interviewQuestions": [{"type":"behavioral","text":"<q1>"}]
}`;

        // Determine model name
        console.log('Attempting to analyze with Claude');

        // Call Claude API
        let result;
        try {
            result = await callClaudeAPI(prompt, cvImages, apiKey, isVisualAnalysis);
        } catch (error) {
            // Rate limit errors
            if (error.message && error.message.includes('rate limit')) {
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: 'Claude API rate limit hit. Please wait a minute and try again.'
                });
            }
            throw error;
        }

        const data = result.data;
        console.log(`Analysis completed using model: ${result.usedModel}`);

        // Claude returns content[0].text
        const rawText = data.content[0].text;
        // Clean up markdown code blocks if present
        const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysisResult = JSON.parse(jsonText);

        // Store in cache
        requestCache.set(cacheKey, {
            timestamp: Date.now(),
            data: analysisResult
        });

        res.json(analysisResult);

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message
        });
    }
});

// Rewrite CV endpoint
app.post('/api/rewrite', async (req, res) => {
    try {
        const { cvText, model } = req.body;
        const apiKey = process.env.CLAUDE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        if (!cvText) {
            return res.status(400).json({ error: 'CV text is required' });
        }

        const prompt = `You are an expert CV writer. Rewrite the following CV to make it more professional, impactful, and ATS-friendly. 
        
        Keep the same information but:
        - Use stronger action verbs
        - Quantify achievements where possible
        - Improve formatting and structure
        - Make it more concise and impactful
        - Optimize for Applicant Tracking Systems
        
        CV TEXT:
        ${cvText.substring(0, 10000)}
        
        Return ONLY the rewritten CV text, no explanations or comments.`;

        console.log('Using Claude for rewrite');

        const response = await fetch(
            'https://api.anthropic.com/v1/messages',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: CLAUDE_MODEL,
                    max_tokens: 2000,
                    messages: [{ role: 'user', content: prompt }]
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const rewrittenCV = data.content[0].text;
        res.json({ rewrittenCV });

    } catch (error) {
        console.error('Rewrite error:', error);
        res.status(500).json({
            error: 'Rewrite failed',
            message: error.message
        });
    }
});

// Generate cover letter endpoint
app.post('/api/coverletter', async (req, res) => {
    try {
        const { cvText, jdText, model } = req.body;
        const apiKey = process.env.CLAUDE_API_KEY;

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

        console.log('Using Claude for cover letter');

        const response = await fetch(
            'https://api.anthropic.com/v1/messages',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: CLAUDE_MODEL,
                    max_tokens: 1500,
                    messages: [{ role: 'user', content: prompt }]
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const coverLetter = data.content[0].text;
        res.json({ coverLetter });

    } catch (error) {
        console.error('Cover letter error:', error);
        res.status(500).json({
            error: 'Cover letter generation failed',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'CV Builder API is running' });
});

// List Models endpoint
app.get('/api/models', async (req, res) => {
    try {
        // Return Claude model information
        const models = [{
            name: CLAUDE_MODEL,
            displayName: 'Claude 3.5 Sonnet',
            description: 'Best quality model for CV analysis'
        }];

        res.json({ models });
    } catch (error) {
        console.error('Error listing models:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// Generate Bullet Point endpoint
app.post('/api/generate-bullet', async (req, res) => {
    try {
        const { keyword, model } = req.body;
        const apiKey = process.env.CLAUDE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        const prompt = `
        Write a single, strong, professional resume bullet point demonstrating the skill: "${keyword}".
        Use action verbs. Do not include any introductory text. Just the bullet point.
        Example for "Python": "Developed automated data processing scripts using Python, reducing manual workload by 40%."
        `;

        const response = await fetch(
            'https://api.anthropic.com/v1/messages',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: CLAUDE_MODEL,
                    max_tokens: 300,
                    messages: [{ role: 'user', content: prompt }]
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const bulletPoint = data.content[0].text.trim();
        res.json({ bulletPoint });

    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({
            error: 'Generation failed',
            message: error.message
        });
    }
});

// Optimize Section endpoint
app.post('/api/optimize-section', async (req, res) => {
    try {
        const { sectionText, sectionType, model } = req.body;
        const apiKey = process.env.CLAUDE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        const prompt = `
        You are an expert professional resume writer. Rewrite the following "${sectionType}" section of a CV to be more impactful, concise, and professional.
        
        Rules:
        1. Use strong action verbs.
        2. Quantify achievements where possible (or leave placeholders like [X]%).
        3. Remove passive voice.
        4. Keep the same core information but make it sound senior and competent.
        5. Return ONLY the rewritten text. Do not include "Here is the rewritten version" or markdown code blocks.
        
        ORIGINAL TEXT:
        ${sectionText}
        `;

        const response = await fetch(
            'https://api.anthropic.com/v1/messages',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: CLAUDE_MODEL,
                    max_tokens: 1000,
                    messages: [{ role: 'user', content: prompt }]
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const optimizedText = data.content[0].text.trim();
        res.json({ optimizedText });

    } catch (error) {
        console.error('Optimization error:', error);
        res.status(500).json({
            error: 'Optimization failed',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 CV Builder backend running on http://localhost:${PORT}`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api/analyze`);
});
