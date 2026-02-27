const { calibrateScores, normalizeRubric, normalizeRiskFlags, toScore } = require('../api/scoring');
const cases = require('../tests/fixtures/scoring-calibration-cases');

function inBand(value, band) {
    return value >= band[0] && value <= band[1];
}

const failures = [];

for (const entry of cases) {
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
            expectedScoreBand: entry.expected.scoreBand,
            expectedJdScoreBand: entry.expected.jdScoreBand,
            actualScore: result.score,
            actualJdScore: result.jdScore,
            riskFlags: result.details.riskFlags
        });
    }
}

const passCount = cases.length - failures.length;
const passRate = Math.round((passCount / cases.length) * 100);

console.log(`Scoring benchmark: ${passCount}/${cases.length} passed (${passRate}%)`);

if (failures.length) {
    console.log('Failing cases:');
    failures.forEach((f) => {
        console.log(
            `- ${f.id}: score ${f.actualScore} expected [${f.expectedScoreBand[0]}, ${f.expectedScoreBand[1]}], ` +
            `jdScore ${f.actualJdScore} expected [${f.expectedJdScoreBand[0]}, ${f.expectedJdScoreBand[1]}], flags=${f.riskFlags.join(',')}`
        );
    });
}

process.exit(passRate >= 90 ? 0 : 1);
