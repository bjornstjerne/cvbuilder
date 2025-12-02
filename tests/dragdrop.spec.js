const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000/'; // fallback if local server available
// If deployed, use the production URL
const PROD_URL = 'https://cv-builder-43x1jl7hs-bjornstjernes-projects.vercel.app/';

test.describe('Drag-and-drop / file upload for CV', () => {
    test('selecting a file populates the CV textarea', async ({ page }) => {
        const url = BASE_URL; // Use local server for testing
        await page.goto(url);

        // Wait for file input to be present
        await page.waitForSelector('#cv-file-upload', { timeout: 10000 });

        // Set file to the file input
        const filePath = require('path').resolve(__dirname, 'fixtures', 'sample_cv.txt');
        await page.setInputFiles('#cv-file-upload', filePath);

        // Allow some time for file processing and event handling
        await page.waitForTimeout(800);

        // Check that the textarea contains expected snippet
        const cvText = await page.$eval('#cv-input', el => el.value);
        expect(cvText).toContain('Bjørnstjerne Bechmann');
        expect(cvText.length).toBeGreaterThan(10);
    });
});
