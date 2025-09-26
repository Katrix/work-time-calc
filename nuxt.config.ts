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
    // 'nuxt-security',
    '@sidebase/nuxt-auth',
  ],
  ssr: true,
  css: [
    '~/assets/scss/app.scss',
    'bootstrap-vue-next/dist/bootstrap-vue-next.css',
    '@fortawesome/fontawesome-svg-core/styles.css',
  ],
  runtimeConfig: {
    authSecret: undefined, // https://next-auth.js.org/configuration/options#secret
    githubClientId: '',
    githubClientSecret: '',
  },
  hub: {
    cache: true,
  },
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
  sourcemap: {
    client: true,
    server: true,
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
      crossOriginEmbedderPolicy: 'unsafe-none',
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'font-src': ["'self'", 'https:'],
        'img-src': ["'self'", 'data:'],
        'worker-src': ["'self'", 'blob:'], // For dev stuff
        'script-src': [
          "'self'",
          'https:',
          "'unsafe-inline'",
          "'strict-dynamic'",
          "'nonce-{{nonce}}'",
          "'unsafe-eval'"
        ]
      },
    },
  },
  auth: {
    baseURL: '/api/auth',
    provider: {
      type: 'authjs',
      defaultProvider: 'github',
    },
  },
  experimental: {
    typedPages: true,
  },
})
