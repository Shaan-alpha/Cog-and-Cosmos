import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// Standalone Svelte config. svelte-check loads this directly; without it, the
// checker falls back to resolving config out of vite.config.ts (a path that
// throws `vite.resolveConfig is not a function`, silently skipping every
// .svelte file). The vite-plugin-svelte plugin also reads this at build time.
export default {
  preprocess: vitePreprocess(),
}
