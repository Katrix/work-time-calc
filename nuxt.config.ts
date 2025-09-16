// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/test-utils', '@bootstrap-vue-next/nuxt', '@vueuse/nuxt', '@pinia/nuxt'],
  ssr: false, // Until I figure out how to deal with localStorage
  css: [
    '~/assets/scss/app.scss',
    'bootstrap-vue-next/dist/bootstrap-vue-next.css',
    '@fortawesome/fontawesome-svg-core/styles.css',
  ],
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
})
