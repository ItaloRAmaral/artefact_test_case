import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
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
