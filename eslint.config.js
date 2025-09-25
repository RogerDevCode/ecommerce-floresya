import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-n';
import promisePlugin from 'eslint-plugin-promise';

export default [
  // Base configuration
  js.configs.recommended,

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './src/frontend/tsconfig.frontend.json', './tsconfig.config.json'],
        tsconfigRootDir: '.',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Node.js and TypeScript globals
        NodeJS: 'readonly',
        // Express/HTTP globals for backend
        Request: 'readonly',
        Response: 'readonly',
        NextFunction: 'readonly',
        // Web APIs available in Node.js
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Intl: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      import: importPlugin,
      n: nodePlugin,
      promise: promisePlugin,
    },
    rules: {
      // TypeScript-specific rules (relaxed for existing codebase)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off', // Too strict for this project
      '@typescript-eslint/no-unsafe-member-access': 'off', // Too strict for this project
      '@typescript-eslint/no-unsafe-call': 'off', // Too strict for this project
      '@typescript-eslint/no-unsafe-return': 'off', // Too strict for this project

      // Import rules (updated)
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'warn', // Downgrade to warning during migration
      'import/no-unresolved': 'warn', // Downgrade to warning during migration
      'import/extensions': [
        'warn', // Downgrade to warning during migration
        'never',
        {
          json: 'always', // json files must have extension
        },
      ],

      // General rules
      'no-console': 'warn',
      'no-unused-vars': 'off', // Handled by @typescript-eslint/no-unused-vars
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'eol-last': 'error',
      'comma-dangle': ['error', 'never'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],

      // Node.js rules
      'n/no-missing-import': 'off', // TypeScript handles this
      'n/no-unsupported-features/es-syntax': 'off', // We use modern ES features

      // Promise rules
      'promise/always-return': 'off', // Too strict
      'promise/catch-or-return': 'error',
      'promise/no-nesting': 'warn',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './src/frontend/tsconfig.frontend.json', './tsconfig.config.json'],
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
        }
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      },
      'import/extensions': ['.js', '.jsx', '.ts', '.tsx', '.json']
    },
  },

  // JavaScript files configuration
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Intl: 'readonly',
      },
    },
    plugins: {
      import: importPlugin,
      n: nodePlugin,
      promise: promisePlugin,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      // Import rules for JS files
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'error',
      'import/extensions': [
        'error',
        'never',
        {
          json: 'always',
        },
      ],
    },
  },

  // Frontend-specific configuration
  {
    files: ['src/frontend/**/*.ts', 'src/shared/types/frontend.ts', 'public/**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        EventTarget: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        NodeList: 'readonly',
        HTMLCollectionOf: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Window: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Allow console in frontend for debugging
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js', 'tests/**/*'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        test: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Tests often use any
      'no-console': 'off', // Allow console in tests
      'import/no-unresolved': 'error'
    },
  },

  // Configuration and script files
  {
    files: [
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'eslint.config.js',
      'vite.config.js',
      'vitest.config.js',
      'tailwind.config.js',
      'postcss.config.js',
      'scripts/**/*.js',
      'scripts/**/*.mjs'
    ],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off', // Allow console in config and scripts
      'import/no-unresolved': 'off', // Disable for config files
      'import/order': 'warn', // Downgrade for scripts
    },
  },

  // Apply Prettier config to disable conflicting rules
  prettierConfig,

  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.vercel/**',
      '.next/**',
      '.trunk/**',
      'coverage/**',
      '*.min.js',
      '**/*.map',
      'public/js/**', // Compiled frontend files
      'public/types/**', // Generated type files
      'public/**/*.js', // All compiled JS files in public
      'public/**/*.d.ts', // All declaration files in public
      '**/*.d.ts', // All TypeScript declaration files
      'assets/**', // Asset files
      'api/**', // API generated files
      // 'scripts/**', // Enable scripts checking with new config
      'logs/**',
      '.env*',
      '*.log',
      '.DS_Store',
      'Thumbs.db',
      'tests/**', // Exclude tests for now due to config issues
      '**/*.test.*', // Exclude test files
      '**/*.spec.*', // Exclude spec files
      // 'src/shared/utils/**', // Enable after migration
      'src/types/**', // Exclude legacy types (kept)
      // 'src/utils/**' // Enable after migration
    ],
  },
];