import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop 1920x1080',
      use: {
        viewport: { width: 1920, height: 1080 },
        browserName: 'chromium',
      },
    },
    {
      name: 'Desktop 1366x768',
      use: {
        viewport: { width: 1366, height: 768 },
        browserName: 'chromium',
      },
    },
    {
      name: 'Desktop 1280x720',
      use: {
        viewport: { width: 1280, height: 720 },
        browserName: 'chromium',
      },
    },
    {
      name: 'Tablet 820x1180',
      use: {
        viewport: { width: 820, height: 1180 },
        browserName: 'chromium',
        hasTouch: true,
      },
    },
    {
      name: 'Mobile 390x844',
      use: {
        viewport: { width: 390, height: 844 },
        browserName: 'chromium',
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 10000,
  },
});
