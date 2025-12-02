const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  reporter: [['list'], ['html', { outputFolder: 'test-results/playwright-report' }]],
  use: {
    headless: true,
    video: 'on', // always record video for debugging
    screenshot: 'only-on-failure',
    actionTimeout: 0,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ],
  outputDir: 'test-results/artifacts'
});
