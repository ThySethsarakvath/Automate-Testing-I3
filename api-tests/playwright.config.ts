import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['line'],
    ['allure-playwright', { 
      resultsDir: 'allure-results',
      detail: true,
      environmentInfo: {
        API_URL: 'http://localhost:3000',
        Framework: 'NestJS',
        Runner: 'Playwright Browserless Client',
        NodeVersion: process.version
      }
    }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  },
  /* This automates booting up your NestJS App before tests begin executing */
  webServer: {
    command: 'cd ../shop-api && npm run start',
    url: 'http://localhost:3000/products',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});