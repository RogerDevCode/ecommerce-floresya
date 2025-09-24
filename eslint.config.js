import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-n';
import promisePlugin from 'eslint-plugin-promise';
import prettierConfig from 'eslint-config-prettier';

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
        project: ['./tsconfig.json', './src/frontend/tsconfig.frontend.json'],
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

      // Import rules (relaxed)
      'import/order': 'off', // Disabled for existing codebase
      'import/no-duplicates': 'warn',
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/extensions': 'off', // TypeScript handles this

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
          project: ['./tsconfig.json', './src/frontend/tsconfig.frontend.json'],
        },
      },
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
    },
  },

  // Frontend-specific configuration
  {
    files: ['src/frontend/**/*.ts', 'public/**/*.js'],
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
    },
  },

  // Configuration files
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
      'no-console': 'off',
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
      'assets/**', // Asset files
      'api/**', // API generated files
      'scripts/**', // Script files
      'logs/**',
      '.env*',
      '*.log',
      '.DS_Store',
      'Thumbs.db',
      'tests/**', // Exclude tests for now due to config issues
      '**/*.test.*', // Exclude test files
      '**/*.spec.*', // Exclude spec files
      'src/shared/utils/**', // Exclude utils with complex configurations
      'src/types/**', // Exclude legacy types
      'src/utils/**' // Exclude utils with config issues
    ],
  },
];