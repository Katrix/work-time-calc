export default defineNuxtRouteMiddleware(to => {
  if (to.path === '/') {
    const calcStore = useCalcStore()
    return navigateTo(`/${calcStore.calcs[0]}`)
  }
})