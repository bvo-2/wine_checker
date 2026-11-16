import { defineConfig, devices } from '@playwright/test';

/** End-to-end tests run against the production build (`npm run build` first). */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'off' },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: [
    {
      command: 'npm run preview',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
    },
    {
      // The same build served from a sub-path, to prove it is location-independent.
      command: 'node e2e/serve-subpath.mjs',
      url: 'http://localhost:4174/some/sub/path/',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
