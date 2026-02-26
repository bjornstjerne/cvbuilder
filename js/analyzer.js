// analyzer.js
window.analyzer = {
    actionVerbs: [
        'led', 'managed', 'developed', 'created', 'implemented', 'designed', 'orchestrated',
        'spearheaded', 'built', 'engineered', 'optimized', 'resolved', 'improved', 'increased',
        'decreased', 'saved', 'negotiated', 'launched', 'initiated', 'coordinated', 'mentored',
        'analyzed', 'collaborated', 'achieved', 'awarded', 'generated', 'delivered'
    ],

    stopWords: new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'experience', 'work', 'job', 'role', 'team', 'skills', 'ability', 'knowledge', 'years', 'degree', 'qualification', 'responsible', 'duties', 'requirements', 'preferred', 'plus', 'strong', 'excellent', 'good', 'communication', 'looking', 'seeking']),

    analyzeCV(cvText, jdText) {
        const words = cvText.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;

        const lowerCvText = cvText.toLowerCase();
        const foundVerbs = this.actionVerbs.filter(verb => lowerCvText.includes(verb));
        const uniqueVerbs = [...new Set(foundVerbs)];

        let score = 0;

        if (wordCount >= 400 && wordCount <= 1000) score += 30;
        else if (wordCount > 200) score += 15;

        if (uniqueVerbs.length > 10) score += 30;
        else if (uniqueVerbs.length > 5) score += 15;
        else score += 5;

        const sections = ['experience', 'education', 'skills', 'summary', 'projects'];
        const foundSections = sections.filter(s => lowerCvText.includes(s));
        if (foundSections.length >= 3) score += 40;
        else score += (foundSections.length * 10);

        score = Math.min(100, score);

        let jdScore = 0;
        let missingKeywords = [];

        if (jdText) {
            const jdAnalysis = this.analyzeJD(jdText, lowerCvText);
            jdScore = jdAnalysis.score;
            missingKeywords = jdAnalysis.missing;
        }

        return { score, wordCount, verbCount: uniqueVerbs.length, foundSections, jdScore, missingKeywords };
    },

    analyzeJD(jdText, cvLowerText) {
        const jdWords = jdText.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !this.stopWords.has(w));

        const frequency = {};
        jdWords.forEach(w => {
            frequency[w] = (frequency[w] || 0) + 1;
        });

        const topKeywords = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(entry => entry[0]);

        const missing = topKeywords.filter(keyword => !cvLowerText.includes(keyword));
        const foundCount = topKeywords.length - missing.length;

        const score = Math.round((foundCount / topKeywords.length) * 100);

        return { score, missing };
    },

    parseSections(text) {
        const sections = [];
        const lines = text.split('\n');
        let currentSection = { title: 'Header/Intro', content: [] };
        const headerRegex = /^(experience|education|skills|summary|profile|projects|certifications|languages|objective)/i;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (trimmed.length < 30 && headerRegex.test(trimmed)) {
                if (currentSection.content.length > 0) {
                    sections.push({ ...currentSection, content: currentSection.content.join('\n') });
                }
                currentSection = { title: trimmed, content: [] };
            } else {
                currentSection.content.push(line);
            }
        });

        if (currentSection.content.length > 0) {
            sections.push({ ...currentSection, content: currentSection.content.join('\n') });
        }

        return sections;
    },

    generateInterviewQuestions(text) {
        const lowerText = text.toLowerCase();
        let categories = ['general'];

        if (lowerText.includes('lead') || lowerText.includes('manager') || lowerText.includes('team')) {
            categories.push('leadership');
        }
        if (lowerText.includes('design') || lowerText.includes('creative') || lowerText.includes('art')) {
            categories.push('creative');
        }
        if (lowerText.includes('code') || lowerText.includes('engineer') || lowerText.includes('developer') || lowerText.includes('data')) {
            categories.push('technical');
        }

        // We assume questionBank is globally available (defined in script.js currently)
        let selectedQuestions = [];
        if (window.questionBank) {
            categories.forEach(cat => {
                if (window.questionBank[cat]) {
                    selectedQuestions = [...selectedQuestions, ...window.questionBank[cat].map(q => ({ text: q, type: cat }))];
                }
            });
        }

        return selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, 3);
    }
};
