// @ts-check
import neostandard from 'neostandard'
import pluginSecurity from 'eslint-plugin-security'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  ...(neostandard({
    ts: false,
    noJsx: true,
    noStyle: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any),
  {
    ignores: ['.yarn/**'],
  },
  pluginSecurity.configs.recommended,
  {
    rules: {
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: ['**/*.{ts,mts,cts,vue}'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.ts', 'prisma.config.ts', 'test/unit/*.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      '@typescript-eslint/only-throw-error': 'error',
    },
  },
  {
    rules: {
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
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
      'object-shorthand': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          caughtErrors: 'none',
        },
      ],
    },
  },
)
