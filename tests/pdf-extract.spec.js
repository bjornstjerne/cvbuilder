const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Small PDF (Hello world) encoded in base64. This is a minimal valid PDF used for testing.
const PDF_BASE64 =
    'JVBERi0xLjUKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHNbIDMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8Ci9MZW5ndGggMTAgPj4Kc3RyZWFtCkhlbGxvIFdvcmxkCmVuZHN0cmVhbQplbmRvYmoKc3RhcnR4cmVmCjY0NgolJUVPRg==';

test('uploads a real PDF and extracts text to the CV textarea', async ({ page, context }) => {
    const PROD_URL = process.env.BASE_URL || 'http://localhost:3000/';
    await page.goto(PROD_URL);

    // Write temporary PDF file to tests/artifacts
    const artifactsDir = path.resolve(__dirname, 'artifacts');
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
    const pdfPath = path.join(artifactsDir, 'sample_cv.pdf');
    fs.writeFileSync(pdfPath, Buffer.from(PDF_BASE64, 'base64'));

    // Upload the PDF via file input
    await page.waitForSelector('#cv-file-upload', { timeout: 10000 });
    await page.setInputFiles('#cv-file-upload', pdfPath);

    // Allow extraction to run (pdf.js loads from CDN and parses)
    await page.waitForTimeout(1500);

    // Check that the CV textarea contains at least some text ("Hello" from the PDF)
    const cvValue = await page.$eval('#cv-input', el => el.value);
    expect(cvValue.length).toBeGreaterThan(0);
});
