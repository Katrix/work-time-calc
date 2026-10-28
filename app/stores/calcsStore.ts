import z from 'zod'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { InternalApi } from 'nitropack/types'
import { nanoid } from 'nanoid'
import { customNanoId } from '#shared/types/calc'

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

  const requestFetch = useRequestFetch()
  const queryClient = useQueryClient()
  const session = useUserSession()
  const scope = effectScope()

  async function addCalc() {
    const defaultCalc = makeNewCalc('hours', presetStore.currentPreset)
    try {
      let publicId
      if (session.loggedIn.value) {
        const res = await requestFetch('/api/calc', {
          method: 'PUT',
          body: calcWithEntriesV2Schema.encode(defaultCalc),
        })
        publicId = res!.publicId
      } else {
        publicId = nanoid(12)
      }

      calcOrder.value.push(publicId)
      calcsLastUpdated.value = Date.now()
      allCalcs.value.set(publicId, { name: defaultCalc.name, mode: defaultCalc.mode })

      await navigateTo({ name: 'calculation', params: { calculation: publicId } })
      return publicId
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

  async function deleteCalc(id: string) {
    await closeCalc(id)
    await $fetch<InternalApi['/api/calc/:id']['delete']>(`/api/calc/${id}`, {
      method: 'DELETE',
    })

    if (import.meta.client) {
      localStorage.removeItem(`calcs.${id}`)
    }
    allCalcs.value.delete(id)
  }

  function firstCalc(): string {
    return calcOrder.value[0]
  }

  async function fetchOpenedCalcs() {
    const { data: openedRes, suspense } = scope.run(() =>
      useQuery(
        {
          queryKey: ['api', 'calc', 'opened'],
          queryFn: async () => await requestFetch<InternalApi['/api/calc/opened']['get']>('/api/calc/opened'),
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

  function fetchLocalOpenedCalcs() {
    const calcsStr = localStorage.getItem('calcs')
    const calcsLastUpdatedStr = localStorage.getItem('calcsLastUpdated')
    const calcsLastUpdatedParsed = calcsLastUpdatedStr ? new Date(calcsLastUpdatedStr).getTime() : Date.now() // So it still loads if it's missing on server

    if (calcsStr && calcsLastUpdatedParsed > calcsLastUpdated.value) {
      calcOrder.value = z.string().array().parse(JSON.parse(calcsStr))
      calcsLastUpdated.value = calcsLastUpdatedParsed
    }
  }

  watchEffect(async () => {
    if (loading.value || !import.meta.client) {
      return
    }

    localStorage.setItem('calcs', JSON.stringify(calcOrder.value))
    localStorage.setItem('calcsLastUpdated', new Date(calcsLastUpdated.value).toISOString())
    if (session.loggedIn.value) {
      if (!calcOrder.value.every((calcId) => customNanoId.safeParse(calcId).success)) {
        // Wait for them to be converted
        return
      }

      try {
        await $fetch('/api/calc/opened', {
          method: 'PUT',
          body: {
            opened: calcOrder.value,
          },
        })
      } catch (e) {
        nuxt.vueApp.runWithContext(() =>
          useToast().create({ body: 'Failed to update opened calcs', variant: 'danger' }),
        )
        console.error('Failed to update opened calcs', e)
      }
    }
  })

  async function fetchCalcList() {
    const { data: allServerCalcs, suspense } = scope.run(() =>
      useQuery(
        {
          queryKey: ['api', 'calc', 'list'],
          queryFn: async () => await requestFetch<InternalApi['/api/calc/list']['get']>('/api/calc/list'),
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

  const route = useRoute()
  async function fetchLocalCalcList() {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('calcs.')) {
        continue
      }

      const id = key.substring('calcs.'.length)
      const dataStr = localStorage.getItem(key)

      const dataSchema = z.object({
        lastUpdated: z.number(),
        data: z.string(),
      })

      if (!dataStr) {
        continue
      }

      const { data, lastUpdated } = dataSchema.parse(JSON.parse(dataStr))
      const calcFromStorage = decodeCalcFromString(data)

      if (session.loggedIn.value) {
        let res
        try {
          res = await $fetch('/api/calc', {
            method: 'PUT',
            body: { ...calcWithEntriesV2Schema.encode(calcFromStorage), updatedAt: lastUpdated, publicId: id },
          })
        } catch (error) {
          console.error('Failed to update local calc:', error)
          nuxt.vueApp.runWithContext(() =>
            useToast().create({ body: `Failed to update calc ${calcFromStorage.name}`, variant: 'danger' }),
          )
          continue
        }

        const newPublicId = res?.publicId ?? id

        allCalcs.value.set(newPublicId, { name: calcFromStorage.name, mode: calcFromStorage.mode })

        if (newPublicId !== id) {
          keysToRemove.push(id)
          const calcOrderIdx = calcOrder.value.indexOf(id)
          if (calcOrderIdx !== -1) {
            calcOrder.value.splice(calcOrderIdx, 1, newPublicId)
          }

          if (route.name === 'calculation' && route.params.calculation === id) {
            await navigateTo(`/${newPublicId}`, { replace: true })
          }
        }
      } else {
        allCalcs.value.set(id, { name: calcFromStorage.name, mode: calcFromStorage.mode })
      }
    }

    keysToRemove.forEach((id) => localStorage.removeItem(`calcs.${id}`))
  }

  async function fetchData() {
    await fetchOpenedCalcs()
    await fetchCalcList()
  }

  async function fetchLocalData() {
    fetchLocalOpenedCalcs()
    await fetchLocalCalcList()

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
    deleteCalc,
    firstCalc,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCalcStore, import.meta.hot))
}
