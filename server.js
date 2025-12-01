const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Analyze endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const { cvText, jdText } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        if (!cvText) {
            return res.status(400).json({ error: 'CV text is required' });
        }

        // Build the prompt
        const prompt = `
        You are an expert CV analyzer and career coach. Analyze the following CV text and Job Description (if provided).
        
        CV TEXT:
        ${cvText.substring(0, 10000)}

        JOB DESCRIPTION:
        ${jdText ? jdText.substring(0, 5000) : "Not provided"}

        Provide a response in strict JSON format with the following structure:
        {
            "score": <number 0-100>,
            "jdScore": <number 0-100, or 0 if no JD>,
            "summary": "<brief summary of the candidate>",
            "strengths": ["<strength 1>", "<strength 2>", ...],
            "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
            "suggestions": ["<specific actionable suggestion 1>", "<suggestion 2>", ...],
            "missingKeywords": ["<keyword 1>", "<keyword 2>", ...],
            "interviewQuestions": [
                {"type": "behavioral", "text": "<question 1>"},
                {"type": "technical", "text": "<question 2>"},
                {"type": "situational", "text": "<question 3>"}
            ]
        }
        `;

        // Call Gemini API
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

        const rawText = data.candidates[0].content.parts[0].text;
        // Clean up markdown code blocks if present
        const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonText);

        res.json(result);

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
        const apiKey = process.env.GEMINI_API_KEY;
        const selectedModel = model || 'models/gemini-2.0-flash-lite-001';

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

        const rewrittenCV = data.candidates[0].content.parts[0].text;
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
        const { cvText, jdText } = req.body;
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
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'CV Builder API is running' });
});

// List Models endpoint
app.get('/api/models', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();

        // Filter for Gemini models that support content generation
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
});

// Generate Bullet Point endpoint
app.post('/api/generate-bullet', async (req, res) => {
    try {
        const { keyword, model } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        // Use the model passed from frontend or default
        // Note: The frontend passes 'models/gemini-...' but the API URL needs just the name or we handle it.
        // Let's stick to a hardcoded reliable model for this simple task or use the one from config.
        const modelName = 'gemini-2.0-flash-lite-001';

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        const prompt = `
        Write a single, strong, professional resume bullet point demonstrating the skill: "${keyword}".
        Use action verbs. Do not include any introductory text. Just the bullet point.
        Example for "Python": "Developed automated data processing scripts using Python, reducing manual workload by 40%."
        `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
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

        const bulletPoint = data.candidates[0].content.parts[0].text.trim();
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
        const apiKey = process.env.GEMINI_API_KEY;
        const modelName = 'gemini-2.0-flash-lite-001';

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
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
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
            error: 'Optimization failed',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 CV Builder backend running on http://localhost:${PORT}`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api/analyze`);
});
