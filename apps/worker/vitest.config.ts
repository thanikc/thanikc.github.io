import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest({
      // AI / Vectorize have no local simulator; every test stubs those bindings
      // through an explicit `env`, so the pool must not open a remote session.
      remoteBindings: false,
      wrangler: { configPath: './wrangler.jsonc' },
    }),
  ],
});
