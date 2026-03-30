import js from '@eslint/js';
import globals from 'globals';

export default [
  // Apply recommended rules (replaces extends: ['eslint:recommended'])
  js.configs.recommended,

  // Custom configuration
  {
    files: ['src/**/*.js', 'test/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,        // Replaces env.browser
        ...globals.node,           // Replaces env.node
        ...globals.jest,           // Replaces env.jest
        browser: 'readonly',       // Replaces env.webextensions
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Global ignores (replaces .eslintignore)
  {
    ignores: ['node_modules/', 'docs/', 'coverage/', 'dist/'],
  },
];