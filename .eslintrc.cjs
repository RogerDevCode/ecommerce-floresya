module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Errores básicos
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': 'off', // Permitido para logging
    'no-debugger': 'error',
    
    // ES6+ Features
    'prefer-const': 'error',
    'prefer-arrow-callback': 'warn',
    'arrow-spacing': 'error',
    'no-var': 'error',
    'prefer-template': 'warn',
    'template-curly-spacing': 'error',
    'object-shorthand': 'warn',
    
    // Import/Export
    'no-duplicate-imports': 'error',
    
    // Async/Await
    'require-await': 'warn',
    'no-async-promise-executor': 'error',
    
    // Code style  
    'indent': ['error', 4],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    
    // Best practices
    'eqeqeq': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-throw-literal': 'error'
  },
  overrides: [
    {
      // Configuración específica para archivos ES5 legacy
      files: [
        'backend/src/controllers/productControllerSupabase.js',
        'backend/src/services/databaseService.js'
      ],
      rules: {
        'no-var': 'off',
        'prefer-const': 'off',
        'prefer-arrow-callback': 'off'
      }
    },
    {
      // Configuración para archivos de test
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-expressions': 'off'
      }
    },
    {
      // Configuración para frontend
      files: ['frontend/**/*.js'],
      env: {
        browser: true,
        node: false
      },
      globals: {
        // Variables globales del frontend si las hay
      }
    }
  ]
};