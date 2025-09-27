import { dehydrate, hydrate, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxt) => {
  const queryClient = new QueryClient({})

  useHydration(
    'vue-query',
    () => dehydrate(queryClient),
    (data) => hydrate(queryClient, data),
  )

  nuxt.vueApp.use(VueQueryPlugin, { queryClient })
})
