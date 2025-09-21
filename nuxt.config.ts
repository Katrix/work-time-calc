// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils',
    '@bootstrap-vue-next/nuxt',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxthub/core',
    'nuxt-security',
  ],
  ssr: true,
  css: [
    '~/assets/scss/app.scss',
    'bootstrap-vue-next/dist/bootstrap-vue-next.css',
    '@fortawesome/fontawesome-svg-core/styles.css',
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
        },
      },
    },
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false,
      },
    },
  },
  imports: {
    presets: [
      {
        from: '@fortawesome/vue-fontawesome',
        imports: ['FontAwesomeIcon', 'FontAwesomeLayers', 'FontAwesomeLayersText'],
      },
    ],
  },
  app: {
    head: {
      title: 'Work-time-calc',
      htmlAttrs: {
        lang: 'en',
      },
    },
  },
  security: {
    strict: true,
    removeLoggers: false,
    xssValidator: false,
    headers: {
      contentSecurityPolicy: {
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'font-src': ["'self'", 'https:'],
        'img-src': ["'self'", 'data:'],
        'worker-src': ["'self'", 'blob:'], // For dev stuff
      },
    },
  },
  experimental: {
    typedPages: true,
  },
})
