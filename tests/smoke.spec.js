const { test, expect } = require('@playwright/test');

test('production smoke: page loads and health ok', async ({ page, request }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000/';
    const appUrl = new URL(baseUrl);

    // Visit production homepage
    await page.goto(appUrl.toString());
    await page.waitForSelector('#cv-input', { timeout: 10000 });
    const exists = await page.$('#cv-input');
    expect(exists).toBeTruthy();

    // Check health endpoint directly
    const healthUrl = new URL('/api/health', appUrl.origin);
    const health = await request.get(healthUrl.toString());
    expect(health.status()).toBe(200);
    const json = await health.json();
    expect(json.status).toBe('ok');
});
