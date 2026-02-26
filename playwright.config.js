const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    timeout: 30000,
    reporter: [['list'], ['html', { outputFolder: 'test-results/playwright-report' }]],
    use: {
        baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
        headless: true,
        video: 'on', // always record video for debugging
        screenshot: 'only-on-failure',
        actionTimeout: 0,
    },
    webServer: process.env.BASE_URL ? undefined : {
        command: 'node server.js',
        url: 'http://127.0.0.1:3000/api/health',
        reuseExistingServer: !process.env.CI,
        timeout: 120000
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' }
        }
    ],
    outputDir: 'test-results/artifacts'
});
