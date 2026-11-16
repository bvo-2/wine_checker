/// <reference types="vitest/config" />
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

/**
 * Writes dist/sw.js after each build: a small service worker that stores every
 * file of the app so it opens and works with no connection. The cache name
 * contains a hash of the files, so each new build replaces the old cache.
 */
function offlineServiceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'decant-offline-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    closeBundle() {
      const hash = createHash('sha256');
      const files = listFiles(outDir)
        .map((file) => relative(outDir, file).split('\\').join('/'))
        // Every supported browser uses .woff2; the .woff fallbacks are not worth caching.
        .filter((file) => file !== 'sw.js' && !file.endsWith('.woff') && !file.endsWith('.map'))
        .sort();
      for (const file of files) hash.update(file).update(readFileSync(join(outDir, file)));
      const urls = files.map((file) => (file === 'index.html' ? './' : `./${file}`));
      const template = readFileSync(join(import.meta.dirname, 'src/sw.template.js'), 'utf8');
      writeFileSync(
        join(outDir, 'sw.js'),
        template
          .replace('__CACHE_VERSION__', hash.digest('hex').slice(0, 16))
          .replace("'__PRECACHE_URLS__'", JSON.stringify(urls)),
      );
    },
  };
}

export default defineConfig({
  // Relative asset paths: the same build works from a domain root or any sub-path.
  base: './',
  plugins: [react(), offlineServiceWorker()],
  build: { target: 'es2022' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    restoreMocks: true,
  },
});
