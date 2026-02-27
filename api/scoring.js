function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function toScore(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return clamp(Math.round(n), 0, 100);
}

function normalizeRubric(rubric) {
    const source = (rubric && typeof rubric === 'object') ? rubric : {};
    return {
        mustHaveCoverage: toScore(source.mustHaveCoverage),
        experienceRelevance: toScore(source.experienceRelevance),
        impactEvidence: toScore(source.impactEvidence),
        roleSpecificity: toScore(source.roleSpecificity),
        writingClarity: toScore(source.writingClarity)
    };
}

const ALLOWED_RISK_FLAGS = new Set([
    'missing_required_skill',
    'seniority_gap',
    'domain_mismatch',
    'tooling_gap',
    'weak_impact_metrics',
    'vague_experience',
    'no_leadership_evidence',
    'job_hopping_concern'
]);

function normalizeRiskFlags(riskFlags) {
    if (!Array.isArray(riskFlags)) return [];
    const unique = new Set();

    riskFlags.forEach((flag) => {
        const normalized = String(flag || '').trim().toLowerCase();
        if (ALLOWED_RISK_FLAGS.has(normalized)) {
            unique.add(normalized);
        }
    });

    return Array.from(unique);
}

function extractRequiredYears(jdText) {
    const text = String(jdText || '').toLowerCase();
    if (!text) return null;

    const regexes = [
        /(?:at least|minimum of|min\.?)\s*(\d{1,2})\s*\+?\s*years?/g,
        /(\d{1,2})\s*\+?\s*years?\s+of\s+experience/g,
        /(\d{1,2})\s*\+?\s*years?\s+experience/g,
        /(\d{1,2})\s*\+?\s*years?\s*(?:required|minimum|preferred)/g,
        /required\s*(?:experience)?\s*[:\-]?\s*(\d{1,2})\s*\+?\s*years?/g
    ];

    let best = null;
    regexes.forEach((re) => {
        let match;
        while ((match = re.exec(text)) !== null) {
            const years = Number(match[1]);
            if (!Number.isFinite(years) || years <= 0 || years > 30) continue;
            if (best == null || years > best) best = years;
        }
    });

    return best;
}

function estimateCandidateYears(cvText) {
    const text = String(cvText || '').toLowerCase();
    if (!text) return null;

    const regexes = [
        /(\d{1,2})\s*\+?\s*years?\s+of\s+experience/g,
        /over\s+(\d{1,2})\s+years?/g,
        /(\d{1,2})\s+years?\s+experience/g
    ];

    let best = null;
    regexes.forEach((re) => {
        let match;
        while ((match = re.exec(text)) !== null) {
            const years = Number(match[1]);
            if (!Number.isFinite(years) || years <= 0 || years > 40) continue;
            if (best == null || years > best) best = years;
        }
    });

    return best;
}

function deriveDeterministicRiskFlags({ cvText, jdText, missingKeywords, rubric, requiredYears, candidateYears }) {
    const flags = new Set();

    if (!/\d/.test(String(cvText || '')) || rubric.impactEvidence < 45) {
        flags.add('weak_impact_metrics');
    }

    if (rubric.experienceRelevance < 45) {
        flags.add('vague_experience');
    }

    if (jdText) {
        if (missingKeywords.length >= 8 || rubric.mustHaveCoverage < 55) {
            flags.add('missing_required_skill');
        }
        if (rubric.roleSpecificity < 45) {
            flags.add('domain_mismatch');
        }
        if (requiredYears != null && candidateYears != null && (candidateYears + 1) < requiredYears) {
            flags.add('seniority_gap');
        }
    }

    return Array.from(flags);
}

const CV_FLAG_PENALTIES = {
    weak_impact_metrics: 8,
    vague_experience: 6,
    domain_mismatch: 5,
    tooling_gap: 4,
    seniority_gap: 5,
    missing_required_skill: 6,
    no_leadership_evidence: 4,
    job_hopping_concern: 4
};

const JD_FLAG_PENALTIES = {
    missing_required_skill: 14,
    seniority_gap: 12,
    domain_mismatch: 10,
    tooling_gap: 8,
    weak_impact_metrics: 6,
    vague_experience: 6,
    no_leadership_evidence: 5,
    job_hopping_concern: 4
};

function sumPenalties(flags, map) {
    return flags.reduce((sum, flag) => sum + (map[flag] || 0), 0);
}

function compressHighScores(score, pivot = 65, factor = 0.55) {
    if (score <= pivot) return score;
    return pivot + (score - pivot) * factor;
}

function calibrateScores({ rawScore, rawJdScore, rubric, riskFlags, missingKeywords, cvText, jdText }) {
    const jdProvided = Boolean(String(jdText || '').trim());
    const requiredYears = jdProvided ? extractRequiredYears(jdText) : null;
    const candidateYears = estimateCandidateYears(cvText);

    const deterministicRiskFlags = deriveDeterministicRiskFlags({
        cvText,
        jdText,
        missingKeywords,
        rubric,
        requiredYears,
        candidateYears
    });

    const combinedRiskFlags = Array.from(new Set([...riskFlags, ...deterministicRiskFlags]));

    const rubricCvScore =
        rubric.impactEvidence * 0.35 +
        rubric.experienceRelevance * 0.25 +
        rubric.roleSpecificity * 0.2 +
        rubric.writingClarity * 0.2;

    const cvPenalty = Math.min(28, sumPenalties(combinedRiskFlags, CV_FLAG_PENALTIES));
    let calibratedScore = rawScore * 0.35 + rubricCvScore * 0.65;
    calibratedScore = compressHighScores(calibratedScore, 66, 0.58);
    calibratedScore = clamp(Math.round(calibratedScore - cvPenalty - (jdProvided ? 4 : 2)), 0, 100);

    let calibratedJdScore = 0;
    let missingKeywordPenalty = 0;
    let yearsGapPenalty = 0;

    if (jdProvided) {
        const rubricFitScore =
            rubric.mustHaveCoverage * 0.45 +
            rubric.experienceRelevance * 0.25 +
            rubric.roleSpecificity * 0.2 +
            rubric.impactEvidence * 0.1;

        missingKeywordPenalty = Math.min(20, Math.round(missingKeywords.length * 1.5));

        if (requiredYears != null && candidateYears != null && candidateYears < requiredYears) {
            const yearsGap = requiredYears - candidateYears;
            yearsGapPenalty = Math.min(14, 4 + yearsGap * 2);
        } else if (requiredYears != null && candidateYears == null) {
            yearsGapPenalty = 6;
        }

        const jdPenalty = Math.min(38, sumPenalties(combinedRiskFlags, JD_FLAG_PENALTIES) + missingKeywordPenalty + yearsGapPenalty);

        calibratedJdScore = rawJdScore * 0.25 + rubricFitScore * 0.75;
        calibratedJdScore = compressHighScores(calibratedJdScore, 62, 0.52);
        calibratedJdScore = Math.round(calibratedJdScore - jdPenalty - 6);

        if (rubric.mustHaveCoverage < 40) calibratedJdScore = Math.min(calibratedJdScore, 55);
        if (rubric.mustHaveCoverage < 25) calibratedJdScore = Math.min(calibratedJdScore, 45);
        if (missingKeywords.length >= 12) calibratedJdScore = Math.min(calibratedJdScore, 50);

        calibratedJdScore = clamp(calibratedJdScore, 0, 100);
    }

    return {
        score: calibratedScore,
        jdScore: calibratedJdScore,
        details: {
            methodology: 'strict-rubric-v1',
            rawModelScore: rawScore,
            rawModelJdScore: rawJdScore,
            rubric,
            riskFlags: combinedRiskFlags,
            penalties: {
                cvPenalty,
                missingKeywordPenalty,
                yearsGapPenalty
            },
            years: {
                required: requiredYears,
                candidate: candidateYears
            }
        }
    };
}

module.exports = {
    toScore,
    normalizeRubric,
    normalizeRiskFlags,
    extractRequiredYears,
    estimateCandidateYears,
    calibrateScores
};
