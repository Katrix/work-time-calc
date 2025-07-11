import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import { neostandard } from 'neostandard/lib/main'
import pluginSecurity from 'eslint-plugin-security'
import globals from 'globals'

export default [
  ...defineConfigWithVueTs(
    ...neostandard({
      ts: false,
      noJsx: true,
      noStyle: true
    }) as any,
    pluginSecurity.configs.recommended,
    {
      rules: {
        'security/detect-object-injection': 'off',
      },
    },
    pluginVue.configs['flat/recommended'] as any,
    vueTsConfigs.recommended,
    {
      languageOptions: {
        ecmaVersion: 'latest',
        globals: {
          ...globals.browser
        },
        parserOptions: {
          tsconfigRootDir: import.meta.dirname,
          extraFileExtensions: ['.vue'],
        }
      },
      rules: {
        '@typescript-eslint/only-throw-error': 'error',
        'vue/html-self-closing': 'off',
        'vue/max-attributes-per-line': [
          'error',
          {
            singleline: 5,
            multiline: 1,
          },
        ],
        'vue/singleline-html-element-content-newline': 'off',
        'vue/html-closing-bracket-newline': 'off',
        'vue/html-indent': 'off',
        'vue/require-default-prop': 'off',

        'import/order': 'error',
        'import/first': 'error',
        'prefer-const': [
          'error',
          {
            destructuring: 'any',
            ignoreReadBeforeAssign: false,
          },
        ],
        'require-await': 'error',
        'no-var': 'error',
        'object-shorthand': 'error'
      },
    },
  ),
  {
    ignores: ['dist', 'node_modules']
  }
]