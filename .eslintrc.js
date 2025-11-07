module.exports = {
  root: true,
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2022: true
  },
  ignorePatterns: [
    'dist/',
    'coverage/',
    'node_modules/',
    '*.d.ts',
    'web-demo/public/'
  ],
  rules: {
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'warn'
  },
  overrides: [
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      rules: {
        'no-undef': 'off' // TypeScript handles this
      }
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    },
    {
      files: ['web-demo/server.js'],
      env: {
        node: true
      }
    },
    {
      files: ['web-demo/public/**/*.js'],
      env: {
        browser: true
      },
      globals: {
        window: 'readonly',
        document: 'readonly'
      }
    }
  ]
};