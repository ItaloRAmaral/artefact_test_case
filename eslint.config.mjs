import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';

const EXTERNAL_TO_CORE = {
  group: [
    'zod',
    'zod/*',
    '@trpc/*',
    '@tanstack/*',
    'next',
    'next/*',
    'react',
    'react/*',
    'react-dom',
    'react-dom/*',
    'server-only',
    'node:*',
    'crypto',
  ],
  message:
    'domains/ is the core and imports nothing external (.claude/rules/backend.md).',
};

const OUTER_RING = {
  group: ['**/adapters/**', '**/tasks-module'],
  message:
    'Dependencies point inward: adapters and the composition root depend on domains/, never the reverse (.claude/rules/backend.md).',
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      'no-console': 'error',
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let'], next: '*' },
        {
          blankLine: 'any',
          prev: ['const', 'let'],
          next: ['const', 'let'],
        },
        { blankLine: 'always', prev: '*', next: 'block-like' },
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: 'directive', next: '*' },
      ],
      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**'],
    rules: {
      'padding-line-between-statements': 'off',
    },
  },
  {
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['src/server/domains/**'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [EXTERNAL_TO_CORE, OUTER_RING] },
      ],
    },
  },
  {
    files: ['src/server/domains/*/entities/**'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            EXTERNAL_TO_CORE,
            OUTER_RING,
            {
              group: ['**/use-cases/**', '**/repositories/**'],
              message:
                'Entities hold the rules only: they know no use case or repository (.claude/rules/backend.md).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/server/*', '**/server/**', 'server-only'],
              message:
                'src/shared is imported by client code, so it never imports server code (DECISIONS D-13).',
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);
