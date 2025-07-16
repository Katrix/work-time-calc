import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import neostandard from 'neostandard'
import pluginSecurity from 'eslint-plugin-security'
import globals from 'globals'

export default [
  ...defineConfigWithVueTs(
    ...(neostandard({
      ts: false,
      noJsx: true,
      noStyle: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pluginSecurity.configs.recommended as any,
    {
      rules: {
        'security/detect-object-injection': 'off',
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pluginVue.configs['flat/recommended'] as any,
    vueTsConfigs.recommended,
    {
      languageOptions: {
        ecmaVersion: 'latest',
        globals: {
          ...globals.browser,
        },
        parserOptions: {
          tsconfigRootDir: import.meta.dirname,
          extraFileExtensions: ['.vue'],
        },
      },
      rules: {
        '@typescript-eslint/only-throw-error': 'error',
        'vue/html-self-closing': 'off',
        'vue/max-attributes-per-line': 'off',
        'vue/singleline-html-element-content-newline': 'off',
        'vue/html-closing-bracket-newline': 'off',
        'vue/html-indent': 'off',
        'vue/require-default-prop': 'off',

        'import-x/order': 'error',
        'import-x/first': 'error',
        'prefer-const': [
          'error',
          {
            destructuring: 'any',
            ignoreReadBeforeAssign: false,
          },
        ],
        'require-await': 'error',
        'no-var': 'error',
        'object-shorthand': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            caughtErrors: 'none',
          },
        ],
      },
    },
  ),
  {
    ignores: ['dist', 'node_modules'],
  },
]
