import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  {
    files: ['**/*.ts'],
    ignores: ['dist', 'node_modules', 'build'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: [
          './tsconfig.json',
          './tsconfig.test.json',
        ],
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      import: eslintPluginImport,
      'simple-import-sort': eslintPluginSimpleImportSort,
    },

    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/ban-ts-comment': 'off',

      'simple-import-sort/imports': [
        'error',
        {
          groups: [['^@/'], ['^\\./', '^\\.\\./']],
        },
      ],
      'simple-import-sort/exports': 'error',
      'import/newline-after-import': ['error', { count: 1 }],
      'import/no-duplicates': 'error',

      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'multi-line'],
    },
  },
];
