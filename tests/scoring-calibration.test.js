const test = require('node:test');
const assert = require('node:assert/strict');
const {
    normalizeRubric,
    extractRequiredYears,
    estimateCandidateYears,
    calibrateScores
} = require('../api/scoring');

test('extract years helpers detect requirement and candidate years', () => {
    const jd = 'We require at least 8+ years of experience in enterprise delivery.';
    const cv = 'Over 5 years of experience leading cross-functional programs.';

    assert.equal(extractRequiredYears(jd), 8);
    assert.equal(estimateCandidateYears(cv), 5);
});

test('calibration penalizes optimistic fit when must-have coverage is weak', () => {
    const rubric = normalizeRubric({
        mustHaveCoverage: 38,
        experienceRelevance: 58,
        impactEvidence: 44,
        roleSpecificity: 40,
        writingClarity: 72
    });

    const calibrated = calibrateScores({
        rawScore: 86,
        rawJdScore: 91,
        rubric,
        riskFlags: ['missing_required_skill'],
        missingKeywords: ['python', 'aws', 'terraform', 'kubernetes', 'microservices', 'spark', 'airflow', 'snowflake', 'dbt'],
        cvText: 'Over 4 years of experience in analytics. Built dashboards and reports.',
        jdText: 'Minimum of 8 years experience required. Must have Python, AWS, Terraform and Kubernetes.'
    });

    assert.ok(calibrated.score < 80, `Expected strict CV score under 80, got ${calibrated.score}`);
    assert.ok(calibrated.jdScore < 60, `Expected strict JD score under 60, got ${calibrated.jdScore}`);
    assert.ok(calibrated.details.riskFlags.includes('seniority_gap'));
});

test('calibration returns jdScore 0 when no job description is provided', () => {
    const rubric = normalizeRubric({
        mustHaveCoverage: 0,
        experienceRelevance: 70,
        impactEvidence: 65,
        roleSpecificity: 68,
        writingClarity: 74
    });

    const calibrated = calibrateScores({
        rawScore: 78,
        rawJdScore: 0,
        rubric,
        riskFlags: [],
        missingKeywords: [],
        cvText: '10 years of experience managing delivery and transformation programs.',
        jdText: ''
    });

    assert.ok(calibrated.score >= 0 && calibrated.score <= 100);
    assert.equal(calibrated.jdScore, 0);
});
