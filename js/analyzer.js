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
        const source = String(text || '').trim();
        if (!source) return [];

        const headingAliases = {
            summary: 'Summary',
            profile: 'Summary',
            objective: 'Summary',
            contact: 'Contact',
            'work experience': 'Experience',
            'professional experience': 'Experience',
            experience: 'Experience',
            'employment history': 'Experience',
            education: 'Education',
            'technical skills': 'Skills',
            'core skills': 'Skills',
            skills: 'Skills',
            projects: 'Projects',
            certifications: 'Certifications',
            languages: 'Languages'
        };

        const inlineHeadingPattern = /(WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY|TECHNICAL SKILLS|CORE SKILLS|EDUCATION|CERTIFICATIONS|LANGUAGES|PROJECTS|SUMMARY|PROFILE|OBJECTIVE|CONTACT|EXPERIENCE|SKILLS)/g;

        const normalizeHeadingKey = (value) => String(value || '')
            .toLowerCase()
            .replace(/[^a-z\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const titleForHeading = (value) => {
            const key = normalizeHeadingKey(value);
            return headingAliases[key] || String(value || '').trim() || 'Section';
        };

        const isHeadingLine = (line) => {
            const trimmed = String(line || '').trim();
            if (!trimmed || trimmed.length > 48) return false;

            const normalized = normalizeHeadingKey(trimmed);
            if (headingAliases[normalized]) return true;

            const words = normalized.split(' ').filter(Boolean);
            if (!words.length || words.length > 4) return false;

            const hasKnownKeyword = words.some((w) => ['experience', 'education', 'skills', 'summary', 'profile', 'projects', 'certifications', 'languages', 'objective', 'contact'].includes(w));
            if (!hasKnownKeyword) return false;

            const alpha = trimmed.replace(/[^A-Za-z]/g, '');
            if (!alpha) return false;
            const uppercaseRatio = (alpha.match(/[A-Z]/g) || []).length / alpha.length;
            return uppercaseRatio >= 0.6;
        };

        const flushSection = (list, section) => {
            const content = section.content.join('\n').trim();
            if (content.length > 8) {
                list.push({ title: section.title, content });
            }
        };

        const parseByLines = (raw) => {
            const normalized = raw
                .replace(/\r\n?/g, '\n')
                .replace(/\t/g, ' ')
                .replace(/\u00A0/g, ' ')
                .replace(/ {2,}(?=(?:WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY|TECHNICAL SKILLS|CORE SKILLS|EDUCATION|CERTIFICATIONS|LANGUAGES|PROJECTS|SUMMARY|PROFILE|OBJECTIVE|CONTACT|EXPERIENCE|SKILLS)\b)/g, '\n')
                .replace(inlineHeadingPattern, '\n$1\n')
                .replace(/\n{3,}/g, '\n\n');

            const sections = [];
            let current = { title: 'Summary', content: [] };
            const lines = normalized.split('\n');

            lines.forEach((line) => {
                const trimmed = line.trim();
                if (!trimmed) return;

                if (isHeadingLine(trimmed)) {
                    flushSection(sections, current);
                    current = { title: titleForHeading(trimmed), content: [] };
                    return;
                }

                current.content.push(trimmed);
            });

            flushSection(sections, current);
            return sections;
        };

        const parseInlineDenseText = (raw) => {
            const normalized = raw.replace(/\r\n?/g, '\n').replace(/\t/g, ' ').replace(/\u00A0/g, ' ');
            const markerRegex = /(^|\n| {2,})(WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY|TECHNICAL SKILLS|CORE SKILLS|EDUCATION|CERTIFICATIONS|LANGUAGES|PROJECTS|SUMMARY|PROFILE|OBJECTIVE|CONTACT|EXPERIENCE|SKILLS)\b/gm;
            const markers = [];
            let match;

            while ((match = markerRegex.exec(normalized)) !== null) {
                const headingStart = match.index + match[1].length;
                markers.push({
                    start: headingStart,
                    heading: match[2]
                });
            }

            if (!markers.length) return [];

            const sections = [];
            const firstStart = markers[0].start;
            if (firstStart > 50) {
                const intro = normalized.slice(0, firstStart).trim();
                if (intro.length > 30) {
                    sections.push({ title: 'Summary', content: intro });
                }
            }

            markers.forEach((marker, idx) => {
                const next = markers[idx + 1];
                const segment = normalized.slice(marker.start, next ? next.start : normalized.length).trim();
                if (!segment) return;

                const heading = titleForHeading(marker.heading);
                const headingRegex = new RegExp(`^${marker.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:?\\s*`, 'i');
                const content = segment.replace(headingRegex, '').trim();
                if (content.length > 8) {
                    sections.push({ title: heading, content });
                }
            });

            return sections;
        };

        const lineSections = parseByLines(source);
        const sectionSet = lineSections.length > 1 ? lineSections : parseInlineDenseText(source);
        const finalSections = (sectionSet.length ? sectionSet : lineSections)
            .slice(0, 8)
            .map((section) => ({
                title: section.title || 'Section',
                content: section.content
            }));

        if (finalSections.length === 1 && normalizeHeadingKey(finalSections[0].title) === 'summary' && finalSections[0].content.length > 1400) {
            return [{
                title: 'Full CV (Auto-detected)',
                content: finalSections[0].content
            }];
        }

        return finalSections;
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
