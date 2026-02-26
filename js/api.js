// api.js
window.api = {
    async fetchModels() {
        try {
            const response = await fetch('/api/models');
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to fetch models');
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async analyzeCV(cvText, jdText, model, cvImages = []) {
        const body = { cvText, jdText, model };
        if (cvImages && cvImages.length > 0) {
            body.cvImages = cvImages;
        }

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 429) {
                throw new Error('Server is busy (Rate Limit). Please wait a minute and try again.');
            }
            throw new Error(errorData.error || errorData.message || 'Analysis failed');
        }

        return await response.json();
    },

    async generateCoverLetter(cvText, jdText, model) {
        const response = await fetch('/api/coverletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvText, jdText, model })
        });

        if (!response.ok) {
            throw new Error('Cover letter generation failed');
        }

        return await response.json();
    },

    async generateBullet(keyword, model) {
        const response = await fetch('/api/generate-bullet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword, model })
        });

        if (!response.ok) {
            throw new Error('Generation failed');
        }

        return await response.json();
    },

    async optimizeSection(sectionText, sectionTitle, model) {
        const response = await fetch('/api/optimize-section', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sectionText, sectionTitle, model })
        });

        if (!response.ok) {
            throw new Error('Optimization failed');
        }

        return await response.json();
    }
};
