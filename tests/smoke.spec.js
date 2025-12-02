const { test, expect } = require('@playwright/test');

test('production smoke: page loads and health ok', async ({ page, request }) => {
    const PROD_URL = 'https://cv-builder-43x1jl7hs-bjornstjernes-projects.vercel.app/';

    // Visit production homepage
    await page.goto(PROD_URL);
    await page.waitForSelector('#cv-input', { timeout: 10000 });
    const exists = await page.$('#cv-input');
    expect(exists).toBeTruthy();

    // Check health endpoint directly
    const health = await request.get(`${PROD_URL}api/health`);
    expect(health.status()).toBe(200);
    const json = await health.json();
    expect(json.status).toBe('ok');
});
