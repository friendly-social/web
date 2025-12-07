import {defineConfig, globalIgnores} from 'eslint/config';
import n from 'eslint-plugin-n';
import prettier from 'eslint-plugin-prettier';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import js from '@eslint/js';
import {FlatCompat} from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    globalIgnores(['**/build/', 'test/fixtures/', '**/template/', '.next/']),
    {
        extends: compat.extends(
            'eslint:recommended',
            'plugin:n/recommended',
            'prettier',
        ),

        plugins: {
            n,
            prettier,
        },

        rules: {
            'prettier/prettier': 'error',
            'block-scoped-var': 'error',
            eqeqeq: 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'eol-last': 'error',
            'prefer-arrow-callback': 'error',
            'no-trailing-spaces': 'error',

            quotes: [
                'warn',
                'single',
                {
                    avoidEscape: true,
                },
            ],

            'no-restricted-properties': [
                'error',
                {
                    object: 'describe',
                    property: 'only',
                },
                {
                    object: 'it',
                    property: 'only',
                },
            ],
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        extends: compat.extends('plugin:@typescript-eslint/recommended'),

        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2018,
            sourceType: 'module',

            parserOptions: {
                projectService: true,
                tsconfigRootDir: '/',
            },
        },

        rules: {
            '@typescript-eslint/ban-ts-comment': 'warn',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/no-warning-comments': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/ban-types': 'off',
            '@/camelcase': 'warn',
            'n/no-missing-import': 'off',
            'n/no-empty-function': 'off',
            'n/no-unsupported-features/es-syntax': 'off',
            'n/no-missing-require': 'off',
            'n/shebang': 'off',
            'no-dupe-class-members': 'off',
            'require-atomic-updates': 'off',
        },
    },
]);
