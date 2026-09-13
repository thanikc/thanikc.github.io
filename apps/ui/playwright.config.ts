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
    // Not a plain file server: scripts/serve-pages.mjs answers unknown paths with
    // 404.html the way GitHub Pages does, which the language redirect depends on.
    command: `node scripts/serve-pages.mjs`,
    env: { PORT: String(PORT) },
    url: `${ORIGIN}/`,
    reuseExistingServer: !process.env['CI'],
  },
});
