const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  testMatch: ['**/live-interactive-qa.spec.js'],
  timeout: 180000,
  retries: 0,
  workers: 1, // Sequential to avoid DB conflicts
  
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on',
    video: 'on',
    screenshot: 'on',
    headless: false, // Run with visible browser
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      slowMo: 600, // 600ms slow down to make browser actions visible
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
