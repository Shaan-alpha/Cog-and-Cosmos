import { defineConfig } from 'vitest/config'

// Dedicated Vitest config — deliberately does NOT load the app's vite.config.ts
// (no PWA/Svelte plugins needed to test the pure TypeScript core). These tests
// pin the behaviour of the framework-agnostic game systems so refactors of the
// economy core can't silently change the game's math.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
