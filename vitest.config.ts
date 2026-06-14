import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Two Vitest *projects* so the browser resolve-condition stays isolated.
//
// The UI render tests mount real Svelte components, so they need Svelte's CLIENT
// build (`resolve.conditions: ['browser']`) — otherwise `mount()` loads the server
// build and throws `lifecycle_function_unavailable`. But a *global* browser
// condition leaks into the node-env core pool and resolves `@vitest/runner` (which
// ships a `browser` export) to a SECOND module instance; `describe`/`it` then
// register on a collector whose "current suite" is null, so every file throws
// "Vitest failed to find the current suite" once enough files run in parallel to
// expose the duplicate-instance race.
//
// Splitting into projects gives each pool its own resolution graph: `core` (node,
// no browser condition) keeps a single `@vitest/runner`; `ui` (jsdom, browser
// condition) gets the Svelte client build. Both compile `.svelte`/`.svelte.ts` via
// the plugin (the core pool needs it for the `*.svelte.ts` store).
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [svelte()],
        test: {
          name: 'core',
          environment: 'node',
          include: ['src/systems/**/*.test.ts', 'src/stores/**/*.test.ts', 'src/data/**/*.test.ts'],
          server: { deps: { inline: ['svelte'] } },
        },
      },
      {
        plugins: [svelte()],
        resolve: { conditions: ['browser'] },
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['src/ui/**/*.test.ts'],
          server: { deps: { inline: ['svelte'] } },
        },
      },
    ],
  },
})
