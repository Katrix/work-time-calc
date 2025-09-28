// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-12-12',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  nitro: {
    preset: 'cloudflare-module',
    prerender: {
      autoSubfolderIndex: false,
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    experimental: {
      wasm: true,
    },
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils',
    '@bootstrap-vue-next/nuxt',
    '@vueuse/nuxt',
    '@pinia/nuxt', // 'nuxt-security',
    'nuxt-auth-utils',
    'nuxt-viewport',
    'nitro-cloudflare-dev',
  ],
  ssr: true,
  css: ['~/assets/scss/app.scss', '@fortawesome/fontawesome-svg-core/styles.css'],
  runtimeConfig: {
    github: {
      appId: '',
      privateKey: '',
    },
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
  viewport: {
    breakpoints: {
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400,
    },
    defaultBreakpoints: {
      mobile: 'md',
    },
    fallbackBreakpoint: 'xxl',
    feature: 'minWidth',
  },
  /*security: {
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
        'script-src': ["'self'", 'https:', "'unsafe-inline'", "'strict-dynamic'", "'nonce-{{nonce}}'", "'unsafe-eval'"],
      },
    },
  },*/
  experimental: {
    typedPages: true,
  },
})
