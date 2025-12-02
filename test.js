/**
 * CV Builder - Comprehensive Test Suite
 * Tests both API endpoints and frontend functionality
 */

const BASE_URL = 'https://cv-builder-43x1jl7hs-bjornstjernes-projects.vercel.app';

// Test results tracker
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// Test helper function
async function test(name, fn) {
    try {
        await fn();
        results.passed++;
        results.tests.push({ name, status: '✅ PASS', error: null });
        console.log(`✅ ${name}`);
    } catch (error) {
        results.failed++;
        results.tests.push({ name, status: '❌ FAIL', error: error.message });
        console.log(`❌ ${name}: ${error.message}`);
    }
}

// Assert helper
function assert(condition, message) {
    if (!condition) throw new Error(message);
}

// Test Suite
async function runTests() {
    console.log('\n🧪 CV Builder Test Suite\n');
    console.log('═'.repeat(50));

    // ============== API TESTS ==============
    console.log('\n📡 API Endpoint Tests\n');

    // Test 1: Health Check
    await test('API Health Check', async () => {
        const response = await fetch(`${BASE_URL}/api/health`);
        assert(response.ok, 'Health endpoint should return 200');
        const data = await response.json();
        assert(data.status === 'ok', 'Health status should be ok');
        assert(typeof data.message === 'string', 'Should have message');
    });

    // Test 2: Analyze Endpoint - Basic CV
    await test('Analyze Endpoint - Basic CV', async () => {
        const response = await fetch(`${BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cvText: 'John Doe\nSoftware Engineer\nExperienced developer',
                jdText: null
            })
        });
        assert(response.ok, 'Analyze endpoint should return 200');
        const data = await response.json();
        assert(typeof data.score === 'number', 'Should return score');
        assert(data.score >= 0 && data.score <= 100, 'Score should be 0-100');
        assert(Array.isArray(data.strengths), 'Should have strengths array');
        assert(Array.isArray(data.weaknesses), 'Should have weaknesses array');
        assert(Array.isArray(data.suggestions), 'Should have suggestions array');
        assert(Array.isArray(data.interviewQuestions), 'Should have interview questions');
    });

    // Test 3: Analyze with Job Description
    await test('Analyze Endpoint - With Job Description', async () => {
        const response = await fetch(`${BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cvText: 'John Doe\nSoftware Engineer with React experience',
                jdText: 'Senior React Developer needed'
            })
        });
        assert(response.ok, 'Should handle JD analysis');
        const data = await response.json();
        assert(typeof data.jdScore === 'number', 'Should return jdScore');
        assert(data.jdScore >= 0 && data.jdScore <= 100, 'JD score should be 0-100');
    });

    // Test 4: Analyze - Missing CV Text
    await test('Analyze Endpoint - Error Handling (Missing CV)', async () => {
        const response = await fetch(`${BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvText: '' })
        });
        assert(response.status === 400, 'Should return 400 for missing CV');
    });

    // Test 5: Generate Bullet Point
    await test('Generate Bullet Endpoint', async () => {
        const response = await fetch(`${BASE_URL}/api/generate-bullet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: 'Python' })
        });
        assert(response.ok, 'Should generate bullet point');
        const data = await response.json();
        assert(typeof data.bulletPoint === 'string', 'Should return bulletPoint string');
        assert(data.bulletPoint.length > 0, 'Bullet point should not be empty');
    });

    // Test 6: Optimize Section
    await test('Optimize Section Endpoint', async () => {
        const response = await fetch(`${BASE_URL}/api/optimize-section`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sectionText: 'I worked at a company',
                sectionType: 'Experience'
            })
        });
        assert(response.ok, 'Should optimize section');
        const data = await response.json();
        assert(typeof data.optimizedText === 'string', 'Should return optimized text');
    });

    // Test 7: Cover Letter Generation
    await test('Cover Letter Endpoint', async () => {
        const response = await fetch(`${BASE_URL}/api/coverletter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cvText: 'John Doe\nSoftware Engineer',
                jdText: 'Looking for Senior Developer'
            })
        });
        assert(response.ok, 'Should generate cover letter');
        const data = await response.json();
        assert(typeof data.coverLetter === 'string', 'Should return cover letter');
        assert(data.coverLetter.length > 0, 'Cover letter should not be empty');
    });

    // Test 8: Models Endpoint
    await test('Models List Endpoint', async () => {
        const response = await fetch(`${BASE_URL}/api/models`);
        assert(response.ok, 'Should list models');
        const data = await response.json();
        assert(Array.isArray(data.models), 'Should return models array');
        assert(data.models.length > 0, 'Should have at least one model');
    });

    // ============== FRONTEND TESTS ==============
    console.log('\n🎨 Frontend DOM Tests\n');

    // Test 9: Homepage loads
    await test('Frontend HTML Structure', async () => {
        const response = await fetch(`${BASE_URL}/`);
        assert(response.ok, 'Homepage should load');
        const html = await response.text();
        assert(html.includes('CV'), 'Should contain CV text');
        assert(html.includes('Analyze'), 'Should contain Analyze button');
    });

    // Test 10: Frontend has required elements
    await test('Frontend Has Required Elements', async () => {
        const response = await fetch(`${BASE_URL}/`);
        const html = await response.text();
        assert(html.includes('index.html') || html.includes('script'), 'Should load scripts');
        assert(html.includes('style') || html.includes('css'), 'Should load styles');
    });

    // Test 11: Static assets load
    await test('Static CSS Loads', async () => {
        const response = await fetch(`${BASE_URL}/style.css`);
        assert(response.ok, 'CSS should load');
        const css = await response.text();
        assert(css.length > 0, 'CSS should have content');
    });

    // Test 12: JavaScript loads
    await test('Frontend JavaScript Loads', async () => {
        const response = await fetch(`${BASE_URL}/script.js`);
        assert(response.ok, 'JavaScript should load');
        const js = await response.text();
        assert(js.length > 0, 'JavaScript should have content');
    });

    // ============== INTEGRATION TESTS ==============
    console.log('\n🔗 Integration Tests\n');

    // Test 13: Full workflow - Analyze + Generate Bullet
    await test('Full Workflow - Analyze and Generate', async () => {
        // Step 1: Analyze
        const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cvText: 'Python Developer with 5 years experience'
            })
        });
        assert(analyzeRes.ok, 'Analysis should succeed');
        const analysis = await analyzeRes.json();

        // Step 2: Generate Bullet from identified strength
        const bulletRes = await fetch(`${BASE_URL}/api/generate-bullet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: analysis.strengths[0] || 'Python' })
        });
        assert(bulletRes.ok, 'Bullet generation should succeed');
    });

    // Test 14: CORS Support
    await test('CORS Headers Present', async () => {
        const response = await fetch(`${BASE_URL}/api/health`);
        const corsHeader = response.headers.get('access-control-allow-origin');
        assert(corsHeader !== null, 'CORS headers should be present');
    });

    // ============== PERFORMANCE TESTS ==============
    console.log('\n⚡ Performance Tests\n');

    // Test 15: API Response Time
    await test('API Response Time (< 15 seconds)', async () => {
        const start = Date.now();
        const response = await fetch(`${BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvText: 'Quick test' })
        });
        const time = Date.now() - start;
        assert(response.ok, 'Request should succeed');
        assert(time < 15000, `Response took ${time}ms (should be < 15000ms)`);
    });

    // ============== RESULTS ==============
    console.log('\n' + '═'.repeat(50));
    console.log('\n📊 Test Results\n');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Total: ${results.passed + results.failed}`);
    console.log(`📊 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);

    if (results.failed > 0) {
        console.log('Failed Tests:');
        results.tests.filter(t => t.status.includes('FAIL')).forEach(t => {
            console.log(`  ❌ ${t.name}: ${t.error}`);
        });
    }

    console.log('\n' + '═'.repeat(50) + '\n');

    return {
        success: results.failed === 0,
        passed: results.passed,
        failed: results.failed,
        total: results.passed + results.failed
    };
}

// Run tests
runTests().then(summary => {
    if (summary.success) {
        console.log('🎉 ALL TESTS PASSED!\n');
        process.exit(0);
    } else {
        console.log(`⚠️  ${summary.failed} test(s) failed\n`);
        process.exit(1);
    }
}).catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
});
