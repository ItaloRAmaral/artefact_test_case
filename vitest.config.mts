import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Outside the react-server condition, server-only's entry throws on import.
      'server-only': fileURLToPath(
        new URL('./node_modules/server-only/empty.js', import.meta.url),
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'components',
          include: ['src/**/*.test.tsx'],
          environment: 'jsdom',
          setupFiles: ['src/test/setup-dom.ts'],
          // A fixed zone with no daylight saving, so local-time assertions are stable.
          env: { TZ: 'America/Sao_Paulo' },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/server/**'],
      exclude: ['**/*.test.{ts,tsx}'],
      thresholds: {
        lines: 90,
        branches: 90,
      },
    },
  },
});
