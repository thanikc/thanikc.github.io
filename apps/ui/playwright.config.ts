import { defineConfig, devices } from '@playwright/test';

/**
 * Browser checks of design compliance (.agents/rules/DESIGN-VERIFICATION.md).
 * Runs against the production build, served statically the way GitHub Pages serves it:
 * `pnpm --filter @thanikc/ui e2e:design` builds first, then runs the suite.
 */
const PORT = 4300;
const ORIGIN = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // Not *.spec.ts: those belong to the Vitest unit suite (`ng test`).
  testMatch: '**/*.e2e.ts',
  outputDir: '../../tmp/design-check/results',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: ORIGIN,
  },
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory dist/thanikc/browser`,
    url: `${ORIGIN}/`,
    reuseExistingServer: !process.env['CI'],
  },
});
