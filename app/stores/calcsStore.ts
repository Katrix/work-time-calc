import z from 'zod'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { InternalApi } from 'nitropack/types'

interface CalcSummary {
  name: string
  mode: 'hours' | 'tasks'
}

export const useCalcStore = defineStore('calcs', () => {
  const presetStore = usePresetStore()
  const calcsLastUpdated = ref(0)
  const calcOrder = ref<string[]>([])
  const allCalcs = ref<Map<string, CalcSummary>>(new Map())
  const loading = ref(true)

  const nuxt = useNuxtApp()

  async function addCalc() {
    const defaultCalc = makeNewCalc('hours', presetStore.currentPreset)
    try {
      const res = await $fetch('/api/calc', {
        method: 'POST',
        body: defaultCalc,
      })

      calcOrder.value.push(res.publicId)
      calcsLastUpdated.value = Date.now()

      await navigateTo({ name: 'calculation', params: { calculation: res.publicId } })
      return res.publicId
    } catch (e) {
      if (import.meta.client) {
        nuxt.vueApp.runWithContext(() => useToast().create({ body: 'Failed to create calc', variant: 'danger' }))
        console.error('Failed to create calc', e)
        throw e
      }
      throw e
    }
  }

  async function closeCalc(id: string) {
    const route = useRoute()
    const needNavigation = route.name === 'calculation' && route.params.calculation === id
    const idx = calcOrder.value.indexOf(id)

    if (idx !== -1) {
      calcOrder.value.splice(idx, 1)
      calcsLastUpdated.value = Date.now()
    }

    if (needNavigation) {
      if (calcOrder.value.length === 0) {
        return await navigateTo('/')
      } else {
        const newIdx = idx !== -1 ? Math.min(idx + 1, calcOrder.value.length - 1) : null
        const nextCalc = newIdx !== null && newIdx >= 0 ? calcOrder.value.find((k, idx) => idx === newIdx) : null
        return await navigateTo({
          name: 'calculation',
          params: { calculation: nextCalc ?? firstCalc() },
        })
      }
    }
  }

  function firstCalc(): string {
    return calcOrder.value[0]
  }

  const headers = useRequestHeaders(['cookie'])
  const queryClient = useQueryClient()
  const session = useUserSession()
  const scope = effectScope()

  async function fetchOpenedCalcs() {
    const { data: openedRes, suspense } = scope.run(() =>
      useQuery(
        {
          queryKey: ['api', 'calc', 'opened'],
          queryFn: async () => await $fetch<InternalApi['/api/calc/opened']['get']>('/api/calc/opened', { headers }),
        },
        queryClient,
      ),
    )!
    await suspense()
    if (!openedRes.value) {
      return // Rely on global error handler
    }

    calcOrder.value = openedRes.value.opened
    calcsLastUpdated.value = new Date(openedRes.value.lastUpated).getTime()
  }

  function fetchLocalOpenedCalcs(toast: ReturnType<typeof useToast>) {
    const calcsStr = localStorage.getItem('calcs')
    const calcsLastUpdatedStr = localStorage.getItem('calcsLastUpdated')
    const calcsLastUpdatedParsed = calcsLastUpdatedStr ? new Date(calcsLastUpdatedStr).getTime() : 1 // 1 so it still loads if it's missing

    if (calcsStr && calcsLastUpdatedParsed > calcsLastUpdated.value) {
      calcOrder.value = z.string().array().parse(JSON.parse(calcsStr))
      calcsLastUpdated.value = calcsLastUpdatedParsed
    }

    watchEffect(async () => {
      localStorage.setItem('calcs', JSON.stringify(calcOrder.value))
      localStorage.setItem('calcsLastUpdated', new Date(calcsLastUpdated.value).toISOString())
      if (session.loggedIn.value) {
        try {
          await $fetch('/api/calc/opened', {
            method: 'PUT',
            body: {
              opened: calcOrder.value,
            },
          })
        } catch (e) {
          toast.create({ body: 'Failed to update opened calcs', variant: 'danger' })
          console.error('Failed to update opened calcs', e)
        }
      }
    })
  }

  async function fetchCalcList() {
    const { data: allServerCalcs, suspense } = scope.run(() =>
      useQuery(
        {
          queryKey: ['api', 'calc', 'list'],
          queryFn: async () => await $fetch<InternalApi['/api/calc/list']['get']>('/api/calc/list', { headers }),
        },
        queryClient,
      ),
    )!
    await suspense()
    allCalcs.value = new Map()
    if (!allServerCalcs.value) {
      return // Rely on global error handler
    }

    for (const entry of allServerCalcs.value) {
      allCalcs.value.set(entry.publicId, { name: entry.name, mode: entry.mode })
    }
  }

  function fetchLocalCalcList(toast: ReturnType<typeof useToast>) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('calcs.')) {
        continue
      }

      const id = key.substring('calcs.'.length)

      const dataStr = localStorage.getItem(key)
      if (!dataStr || allCalcs.value.has(id)) {
        continue
      }

      const dataSchema = z.object({
        data: z.string(),
      })

      const data = dataSchema.parse(JSON.parse(dataStr))

      const calcFromStorage = decodeCalcFromString(data.data)
      allCalcs.value.set(id, { name: calcFromStorage.name, mode: calcFromStorage.mode })
    }
  }

  async function fetchData() {
    await fetchOpenedCalcs()
    await fetchCalcList()
  }

  function fetchLocalData(toast: ReturnType<typeof useToast>) {
    fetchLocalOpenedCalcs(toast)
    fetchLocalCalcList(toast)

    loading.value = false
  }

  return {
    calcsLastUpdated,
    calcOrder,
    allCalcs,
    loading,
    fetchData,
    fetchLocalData,
    addCalc,
    closeCalc,
    firstCalc,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCalcStore, import.meta.hot))
}
