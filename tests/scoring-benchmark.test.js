const test = require('node:test');
const assert = require('node:assert/strict');
const { calibrateScores, normalizeRubric, normalizeRiskFlags, toScore } = require('../api/scoring');
const cases = require('./fixtures/scoring-calibration-cases');

function inBand(value, band) {
    return value >= band[0] && value <= band[1];
}

test('scoring benchmark stays within expected business bands', () => {
    const failures = [];

    cases.forEach((entry) => {
        const input = entry.input;
        const result = calibrateScores({
            rawScore: toScore(input.rawScore),
            rawJdScore: toScore(input.rawJdScore),
            rubric: normalizeRubric(input.rubric),
            riskFlags: normalizeRiskFlags(input.riskFlags),
            missingKeywords: input.missingKeywords,
            cvText: input.cvText,
            jdText: input.jdText
        });

        const scoreOk = inBand(result.score, entry.expected.scoreBand);
        const jdScoreOk = inBand(result.jdScore, entry.expected.jdScoreBand);
        if (!scoreOk || !jdScoreOk) {
            failures.push({
                id: entry.id,
                expected: entry.expected,
                actual: { score: result.score, jdScore: result.jdScore },
                flags: result.details.riskFlags
            });
        }
    });

    const passRate = (cases.length - failures.length) / cases.length;
    assert.ok(
        passRate >= 0.9,
        `Benchmark pass rate ${Math.round(passRate * 100)}% below target 90%. Failing cases: ${JSON.stringify(failures, null, 2)}`
    );
});
