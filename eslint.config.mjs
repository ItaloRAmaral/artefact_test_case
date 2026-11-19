import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';

// Hexagonal dependency rule (.claude/rules/backend.md, DECISIONS D-04, D-13, D-17):
// the core (domain and application) imports no framework, library or Node module.
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
    'The domain and application layers import nothing external (.claude/rules/backend.md).',
};

const OUTER_LAYERS = {
  group: ['**/infra/**', '**/trpc/**'],
  message:
    'Dependencies point inward: only infra/ and trpc/ may depend on the core (.claude/rules/backend.md).',
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
      'no-console': 'error',
      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['src/server/**/domain/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            EXTERNAL_TO_CORE,
            OUTER_LAYERS,
            {
              group: ['**/application/**'],
              message:
                'The domain does not depend on the application layer (.claude/rules/backend.md).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/server/**/application/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [EXTERNAL_TO_CORE, OUTER_LAYERS] },
      ],
    },
  },
  {
    files: ['src/shared/**'],
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
