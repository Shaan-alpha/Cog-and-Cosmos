import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Vitest config. The Svelte plugin lets us compile .svelte / .svelte.ts so the
// UI render-smoke tests can mount real components; the pure-core tests run under
// the default node environment and don't touch it. Per-file `@vitest-environment
// jsdom` opts the render tests into a DOM.
export default defineConfig({
  plugins: [svelte()],
  // Resolve Svelte's client build so component mount() works under Vitest
  // (otherwise it loads the server build, where mount() throws).
  resolve: { conditions: ['browser'] },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    server: { deps: { inline: ['svelte'] } },
  },
})
