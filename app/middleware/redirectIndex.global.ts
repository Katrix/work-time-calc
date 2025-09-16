export default defineNuxtRouteMiddleware(to => {
  if (to.path === '/') {
    const calcs = useLocalStorage<string[]>('calculations', () => [crypto.randomUUID()])
    return navigateTo(`/${calcs.value[0]}`)
  }
})