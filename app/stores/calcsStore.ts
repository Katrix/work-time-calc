export const useCalcStore = defineStore('calcs', () => {
  const calcs = useLocalStorage<string[]>('calculations', [crypto.randomUUID()])

  function addCalc() {
    clearOldLocalStorageItems()
    const newId = crypto.randomUUID()
    calcs.value.push(newId)
    navigateTo({ name: 'calculation', params: { calculation: newId } })
  }

  function removeCalc(idx: number) {
    const route = useRoute()
    const needNavigation = route.name === 'calculation' && route.params.calculation === calcs.value[idx]
    calcs.value.splice(idx, 1)
    if (needNavigation) {
      navigateTo({
        name: 'calculation',
        params: { calculation: calcs.value[Math.min(idx + 1, calcs.value.length - 1)] },
      })
    }
    clearOldLocalStorageItems()
  }

  function clearOldLocalStorageItems() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key !== 'calculations' && calcs.value.every((s) => !key.includes(s)) && !key.includes('presets')) {
        localStorage.removeItem(key)
      }
    }
  }

  function calcName(idx: number) {
    const storeId = calcs.value[idx]
    const store = useSettingsStore(storeId)
    return store.nameInput.length ? store.nameInput : `Calc${idx + 1}`
  }

  return {
    calcs,
    addCalc,
    removeCalc,
    calcName
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCalcStore, import.meta.hot))
}
