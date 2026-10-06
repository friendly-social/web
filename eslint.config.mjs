import {defineConfig, globalIgnores} from 'eslint/config';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import n from 'eslint-plugin-n';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default defineConfig([
    {
        files: ['src/**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
        ],
        plugins: {
            n,
            'react-hooks': reactHooks,
        },
        settings: {
            // Fix for ESLint 10+: eslint-plugin-react uses context.getFilename() (legacy API)
            // which was removed in ESLint 10 flat config. Declaring the version explicitly
            // prevents the plugin from trying to auto-detect it and failing.
            react: {version: '19'},
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            'block-scoped-var': 'error',
            eqeqeq: 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'eol-last': 'error',
            'prefer-arrow-callback': 'error',
            'no-trailing-spaces': 'error',

            semi: ['error', 'always'],
            indent: ['error', 4, {SwitchCase: 1}],

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

            '@typescript-eslint/ban-ts-comment': 'warn',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/no-warning-comments': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
            '@typescript-eslint/consistent-type-definitions': [
                'error',
                'interface',
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                    enableAutofixRemoval: {
                        imports: true,
                    },
                },
            ],
            'n/no-missing-import': 'off',
            'n/no-empty-function': 'off',
            'n/no-unsupported-features/es-syntax': 'off',
            'n/no-missing-require': 'off',
            'n/shebang': 'off',
            'no-dupe-class-members': 'off',
            'require-atomic-updates': 'off',
        },
    },
    {
        files: ['src/**/*.tsx'],
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-hooks/exhaustive-deps': 'off',
            'react-hooks/set-state-in-effect': 'off',
        },
    },
    prettier,
    globalIgnores(['**/build/', 'dist/', 'test/fixtures/', '**/template/']),
]);
