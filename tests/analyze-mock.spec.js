const { test, expect } = require('@playwright/test');

test('analyze flow with mocked API response', async ({ page }) => {
    const PROD_URL = process.env.BASE_URL || 'http://localhost:3000/';
    await page.addInitScript(() => {
        // Prevent restore-draft prompt from blocking automation if localStorage has stale data.
        window.confirm = () => false;
    });

    // Mock the /api/analyze response to avoid external API calls
    await page.route('**/api/analyze', route => {
        if (route.request().method() === 'POST') {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    score: 88,
                    jdScore: 75,
                    suggestions: ['Use more action verbs', 'Add measurable results'],
                    missingKeywords: ['React', 'Node.js'],
                    interviewQuestions: [
                        { type: 'technical', text: 'Describe a complex system you designed.' }
                    ]
                })
            });
        } else {
            route.continue();
        }
    });

    await page.goto(PROD_URL);

    // Fill CV textarea
    await page.fill('#cv-input', `Professional Summary
Senior consultant with delivery and stakeholder management experience.

Experience
Led cross-functional teams to deliver complex projects.

Skills
Agile, Project Management, Data Analysis`);

    // Click analyze button
    const analyzeBtn = await page.$('#analyze-btn');
    expect(analyzeBtn).toBeTruthy();
    const responsePromise = page.waitForResponse(r => r.url().includes('/api/analyze') && r.request().method() === 'POST');
    await analyzeBtn.click();

    // Wait for the mocked network response to be sent and verify it.
    const resp = await responsePromise;
    const respBody = await resp.json();
    expect(respBody.score).toBe(88);

    // Allow UI a moment to update from the response
    await page.waitForTimeout(2000);

    // Wait for mocked response to be processed and UI to update
    // Use web-first assertion with auto-retry to handle animation
    await expect(page.locator('#score-value')).toHaveText('88', { timeout: 10000 });

    // Check that suggestions and missing keywords rendered
    await expect(page.locator('#suggestions-list li')).toHaveCount(2);
    await expect(page.locator('#suggestions-list li').first()).toContainText('Use more action verbs');

    await expect(page.locator('#missing-keywords-list .keyword-tag')).toContainText(['React', 'Node.js']);
    await expect(page.locator('#tuner-section')).not.toHaveClass(/hidden/);
    await expect(page.locator('#tuner-container .tuner-card')).toHaveCount(3);
});
