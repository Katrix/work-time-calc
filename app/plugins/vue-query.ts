import { dehydrate, hydrate, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxt) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        onError: (error) => {
          nuxt.vueApp.runWithContext(() => {
            useToast().create({ body: error.message, variant: 'danger' })
            console.error(error)
          })
        },
      },
    },
  })

  useHydration(
    'vue-query',
    () => dehydrate(queryClient),
    (data) => hydrate(queryClient, data),
  )

  nuxt.vueApp.use(VueQueryPlugin, { queryClient, enableDevtoolsV6Plugin: true })
})
