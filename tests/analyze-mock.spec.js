const { test, expect } = require('@playwright/test');

test('analyze flow with mocked API response', async ({ page }) => {
  const PROD_URL = 'https://cv-builder-43x1jl7hs-bjornstjernes-projects.vercel.app/';
  await page.goto(PROD_URL);

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

  // Fill CV textarea
  await page.fill('#cv-input', 'Sample CV content for mock test');

  // Click analyze button
  const analyzeBtn = await page.$('#analyze-btn');
  if (analyzeBtn) await analyzeBtn.click();

  // Wait for mocked response to be processed and UI to update
  await page.waitForSelector('#score-value');
  const score = await page.$eval('#score-value', el => el.textContent);
  expect(Number(score)).toBeGreaterThanOrEqual(80);

  // Check that suggestions and missing keywords rendered
  await page.waitForSelector('#suggestions-list li');
  const suggestions = await page.$$eval('#suggestions-list li', els => els.map(e => e.textContent));
  expect(suggestions.length).toBeGreaterThan(0);
  const missing = await page.$$eval('#missing-keywords-list .keyword-tag', els => els.map(e => e.textContent));
  expect(missing).toContain('React');
});
