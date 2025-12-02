const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://cv-builder-43x1jl7hs-bjornstjernes-projects.vercel.app/';

test.describe('CV Builder UI tests', () => {
    test('can analyze CV and display results', async ({ page }) => {
        await page.goto(BASE_URL);

        // Wait for page to load key elements
        await page.waitForSelector('textarea, [data-cv-input], #cvText, .cv-input', { timeout: 10000 }).catch(() => { });

        // Try a few selectors that might be used for the CV input
        const selectors = ['textarea#cvText', 'textarea', '[data-cv-input]', '.cv-input textarea'];
        let cvHandle = null;
        for (const s of selectors) {
            const el = await page.$(s);
            if (el) { cvHandle = el; break; }
        }
        expect(cvHandle).toBeTruthy();

        const sampleCV = `John Doe\nSoftware Engineer\n\nExperience:\n- Built web apps using React and Node.js\n- Led a team of 4 engineers\n- Improved performance by 40%\n\nSkills: JavaScript, React, Node.js`;

        // Fill the CV input
        await cvHandle.fill(sampleCV);

        // Optional: try to fill JD field if present
        const jdSelectors = ['textarea#jdText', '#jdText', '[data-jd-input]', '.jd-input textarea'];
        for (const s of jdSelectors) {
            const el = await page.$(s);
            if (el) {
                await el.fill('Looking for Senior Software Engineer with React and Node.js experience');
                break;
            }
        }

        // Click the analyze button (try common selectors)
        const buttonSelectors = ["button#analyzeBtn", "button:has-text('Analyze')", "button:has-text('Analyze & Match')", "button:has-text('Analyze & Match')"];
        let clicked = false;
        for (const s of buttonSelectors) {
            const btn = await page.$(s);
            if (btn) { await btn.click(); clicked = true; break; }
        }
        if (!clicked) {
            // try to click any button with Analyze text
            const btn = await page.locator('button').filter({ hasText: /Analyze/i }).first();
            if (await btn.count() > 0) { await btn.click(); clicked = true; }
        }
        expect(clicked).toBeTruthy();

        // Wait for network request to /api/analyze
        const [response] = await Promise.all([
            page.waitForResponse(resp => resp.url().includes('/api/analyze') && resp.status() === 200),
            page.waitForTimeout(2000) // Allow time for DOM updates
        ]);

        // Refine selectors for results area
        const refinedSelectors = [
            'text=/\d{1,3}\/\s*100/',
            'text=Improvement Suggestions',
            'text=Missing Keywords',
            'text=Interview Prep'
        ];

        let resultsFound = false;
        for (const selector of refinedSelectors) {
            const element = await page.locator(selector).first();
            if (await element.count() > 0) {
                resultsFound = true;
                break;
            }
        }

        expect(resultsFound).toBeTruthy();
    }, 30000);
});
