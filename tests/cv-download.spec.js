const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('download CV as PDF creates a non-empty file', async ({ page }) => {
    const appUrl = process.env.BASE_URL || 'http://localhost:3000/';
    await page.addInitScript(() => {
        window.confirm = () => false;
    });
    await page.goto(appUrl);

    await page.fill('#cv-input', `SUMMARY
Senior consultant with 8 years of experience in digital transformation.

EXPERIENCE
- Led cross-functional delivery programs across multiple teams.
- Improved release predictability by 30% through prioritization and planning.

EDUCATION
MSc, Digital Innovation & Management

SKILLS
Agile, Scrum, SAFe, Product Management, Stakeholder Management`);

    await page.evaluate(() => {
        const action = document.getElementById('cover-letter-action');
        if (action) action.classList.remove('hidden');
    });

    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        page.click('#download-cv-btn')
    ]);

    const artifactsDir = path.resolve(__dirname, 'artifacts');
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
    const downloadPath = path.join(artifactsDir, 'downloaded_cv.pdf');
    await download.saveAs(downloadPath);

    const stat = fs.statSync(downloadPath);
    expect(stat.size).toBeGreaterThan(1024);
});
