// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import neostandard from 'neostandard'
import pluginSecurity from 'eslint-plugin-security'

export default [
  withNuxt(
    ...(neostandard({
      ts: false,
      noJsx: true,
      noStyle: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any),
    pluginSecurity.configs.recommended as any,
    {
      rules: {
        'security/detect-object-injection': 'off',
      },
    },
    {
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
]
