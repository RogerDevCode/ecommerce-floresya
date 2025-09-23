/**
 * ESLint 9 Flat Config for FloresYa E-commerce TypeScript Project
 * Industry Standard 2025 — Zero Tech Debt + Typed Linting Edition
 */

import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Configuración base recomendada
  tseslint.configs.recommended,
  
  // Configuración con typed linting (reglas que requieren type checking)
  tseslint.configs.recommendedTypeChecked,
  
  // Configuración específica para tu proyecto
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      // 🌸 SSOT (Single Source of Truth) Rules - ZERO TOLERANCE
      '@typescript-eslint/no-redeclare': 'error', // ❌ Prohibido redeclarar variables/tipos
      'no-redeclare': 'error', // ❌ Prohibido redeclarar variables nativas
      'no-duplicate-imports': 'error', // ❌ Prohibido imports duplicados

      // Overrides industriales
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off', // ✅ Permitido para Supabase/JWT
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/prefer-optional-chain': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always'],
    },
  },

  // Configuración para JavaScript (sin type-checking)
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Desactiva reglas de estilo — deja eso a Prettier
  prettier,

  // Ignora archivos
  {
    ignores: [
      'dist/**/*',
      'public/**/*',
      'api/**/*',
      'tests/**/*',
      'node_modules/**/*',
      'scripts/**/*.js',
      '*.config.js',
      'src/config/supabase-types.d.ts',
      'src/config/swagger.d.ts',
      '.claude/**/*',
    ],
  },
);