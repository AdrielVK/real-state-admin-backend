import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'eslint.config.mjs',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.js',
      '*.cjs',
      'src/generated/**',
      'prisma/seed.ts',
    ],
  },

  // Base configs
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintPluginUnicorn.configs['flat/recommended'],

  // Prettier (must be last to override formatting rules)
  eslintPluginPrettierRecommended,

  // Project-wide settings
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Custom rules — production-grade strictness
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // ── TypeScript strictness ──────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-member-accessibility': ['warn', { accessibility: 'no-public' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/no-confusing-non-null-assertion': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/promise-function-async': 'warn',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-extraneous-class': 'off', // NestJS uses decorator-based classes

      // ── Import sorting ─────────────────────────────────────────
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side-effect imports
            ['^\\u0000'],
            // Node builtins
            ['^node:'],
            // NestJS
            ['^@nestjs'],
            // External packages
            ['^@?\\w'],
            // Internal path aliases
            [
              '^@shared/',
              '^@users-auth/',
              '^@properties/',
              '^@publications/',
              '^@clients/',
              '^@owners-of-properties/',
              '^@contracts/',
            ],
            // Relative imports
            ['^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // ── General code quality ───────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-return-await': 'off', // Handled by TS
      'require-await': 'off', // Handled by TS
      'no-param-reassign': 'error',
      'no-underscore-dangle': 'off',
      'prefer-const': 'error',
      'prefer-destructuring': ['warn', { object: true, array: false }],
      'prefer-template': 'warn',
      'no-nested-ternary': 'error',
      'max-depth': ['warn', 4],
      complexity: ['warn', 15],

      // ── Unicorn overrides ──────────────────────────────────────
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true,
            pascalCase: true,
          },
          ignore: [/\.spec\.ts$/, /\.e2e-spec\.ts$/, /\.module\.ts$/],
        },
      ],
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-top-level-await': 'off',

      // ── Prettier ───────────────────────────────────────────────
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  // Test files — relaxed rules
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'unicorn/consistent-function-scoping': 'off',
    },
  },

  // Domain files — allow defensive null checks in equals() and validation
  {
    files: ['src/shared/domain/**/*.ts', 'src/**/domain/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },

  // Cross-context import restrictions
  {
    files: ['src/properties/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@users-auth/*',
                '@clients/*',
                '@contracts/*',
                '@publications/*',
                '@owners-of-properties/*',
              ],
              message: 'Cross-context imports forbidden. Use domain events.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/publications/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@users-auth/*',
                '@clients/*',
                '@contracts/*',
                '@properties/*',
                '@owners-of-properties/*',
              ],
              message: 'Cross-context imports forbidden. Use domain events.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/clients/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@users-auth/*',
                '@properties/*',
                '@contracts/*',
                '@publications/*',
                '@owners-of-properties/*',
              ],
              message: 'Cross-context imports forbidden. Use domain events.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/owners-of-properties/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@users-auth/*',
                '@clients/*',
                '@contracts/*',
                '@publications/*',
                '@properties/*',
              ],
              message: 'Cross-context imports forbidden. Use domain events.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/contracts/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@users-auth/*',
                '@clients/*',
                '@properties/*',
                '@publications/*',
                '@owners-of-properties/*',
              ],
              message: 'Cross-context imports forbidden. Use domain events.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/users-auth/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@properties/*',
                '@clients/*',
                '@contracts/*',
                '@publications/*',
                '@owners-of-properties/*',
              ],
              message: 'Cross-context imports forbidden. Use domain events.',
            },
          ],
        },
      ],
    },
  },
);
