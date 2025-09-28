import * as devalue from 'devalue'
import z from 'zod'
import { allVersionsPresetSchema } from '#shared/types/preset'
import { useMutation } from '@tanstack/vue-query'
import type { InternalApi } from 'nitropack/types'
import { debounceFilter } from '@vueuse/core'

const defaultPresetName = 'Default'
const defaultPreset: Preset = {
  version: currentPresetVersion,
  hours: {
    workTime: 8 * 60,
    defaultFrom: 8 * 60 + 45,
    defaultTo: 17 * 60,
    precision: 5,
    tags: new Map(),
  },
  tasks: {
    workTime: 0,
    defaultFrom: 0,
    defaultTo: 0,
    precision: 10,
    tags: new Map(),
  },
  github: new Map(),
  holidayRules: [
    { type: 'christmas' },
    { type: 'easter' },
    { type: 'ascension' },
    { type: 'pentecost' },
    { type: 'saturday' },
    { type: 'sunday' },
  ],
}

export const usePresetStore = defineStore('presetStore', () => {
  const presets = ref<Map<string, Preset>>(new Map<string, Preset>([[defaultPresetName, defaultPreset]]))
  const lastUpdated = ref(0)
  const defaultExistsOnServer = ref(true)

  const dataFetched = ref(false)
  watch(
    presets,
    () => {
      if (dataFetched.value) {
        lastUpdated.value = Date.now()

        if (import.meta.client) {
          localStorage.setItem(
            'presets',
            JSON.stringify({ lastUpdated: lastUpdated.value, data: devalue.stringify(presets.value) }),
          )
        }
      }
    },
    { deep: true },
  )
  const nuxt = useNuxtApp()

  async function fetchData() {
    const headers = useRequestHeaders(['cookie'])

    try {
      // $fetch here is fine, as this will likely run on the server with SSR
      const res = await $fetch('/api/presets', { headers })
      presets.value = new Map(Object.entries(z.record(z.string(), presetV2Schema).parse(res.presets)))
      if (!presets.value.has(defaultPresetName)) {
        presets.value.set(defaultPresetName, defaultPreset)
        defaultExistsOnServer.value = false
      }

      lastUpdated.value = res.lastUpdated !== undefined ? new Date(res.lastUpdated).getTime() : 0
      currentPresetId.value = res.currentPreset ?? defaultPresetName
    } catch (e) {
      if (import.meta.client) {
        nuxt.vueApp.runWithContext(() => useToast().create({ body: 'Failed to fetch presets', variant: 'danger' }))
        console.error('Error fetching presets', e)
      } else {
        throw e
      }
    }
  }

  function fetchLocalData(toast: ReturnType<typeof useToast>) {
    const presetsStr = localStorage.getItem('presets')
    if (presetsStr) {
      const schema = z.object({
        lastUpdated: z.number(),
        data: z.string(),
      })

      const presetsObj = schema.safeParse(JSON.parse(presetsStr))
      if (presetsObj.data && presetsObj.data.lastUpdated > lastUpdated.value) {
        presets.value = z.map(z.string(), allVersionsPresetSchema).parse(devalue.parse(presetsObj.data.data))
      }
      if (presetsObj.error) {
        toast.create({ body: 'Failed to parse presets', variant: 'danger' })
        console.error('Error parsing presets', presetsObj.error)
      }
    }

    dataFetched.value = true
  }

  const allUpdateTypes = ['github', 'settings', 'holiday', 'all'] as const
  type UpdateType = (typeof allUpdateTypes)[number]
  const updates = ref(new Map<string, UpdateType[]>())

  function markUpdate(name: string, type: UpdateType) {
    updates.value.set(name, [...(updates.value.get(name) ?? []), type])
  }

  const runUpdate = useMutation({
    mutationFn: async () => {
      return await Promise.all(
        [...updates.value.entries()].flatMap(([name, types]) => {
          const preset = presets.value.get(name)
          if (!preset) {
            return
          }

          const distinctTypes = [...new Set(types)]
          if (
            (name === defaultPresetName && !defaultExistsOnServer.value) ||
            distinctTypes.includes('all') ||
            distinctTypes.length === allUpdateTypes.length - 1
          ) {
            return [
              $fetch(`/api/presets/${name}`, {
                method: 'PUT',
                body: preset,
              }),
            ]
          } else {
            return [
              distinctTypes.includes('github')
                ? [
                    $fetch(`/api/presets/${name}/github`, {
                      method: 'PUT',
                      body: Object.fromEntries(
                        [...preset.github.entries()].map(([k, v]) => [
                          k,
                          { ...v, repos: Object.fromEntries(v.repos.entries()) },
                        ]),
                      ),
                    }),
                  ]
                : [],
              distinctTypes.includes('holiday')
                ? [
                    $fetch(`/api/presets/${name}/holiday`, {
                      method: 'PUT',
                      body: preset.holidayRules,
                    }),
                  ]
                : [],
              distinctTypes.includes('settings')
                ? [
                    $fetch(`/api/presets/${name}/settings`, {
                      method: 'PUT',
                      body: preset,
                    }),
                  ]
                : [],
            ].flat()
          }
        }),
      )
    },
    onSuccess() {
      if (updates.value.has(defaultPresetName) && !defaultExistsOnServer.value) {
        defaultExistsOnServer.value = true
      }
      updates.value.clear()
    },
  })

  const currentPresetId = ref(defaultPresetName)
  watchWithFilter(
    currentPresetId,
    async () => {
      if (import.meta.client) {
        await $fetch(`/api/presets/current`, {
          method: 'PUT',
          body: {
            preset: currentPresetId.value,
          },
        })
      }
    },
    {
      eventFilter: debounceFilter(1000),
    },
  )

  const currentPreset = computed<Preset, Preset>({
    get() {
      return presets.value.get(currentPresetId.value)!
    },
    set(value) {
      presets.value.set(currentPresetId.value, value)
    },
  })
  const sessionState = useUserSession()

  const newPreset = useMutation({
    async mutationFn(name: string) {
      if (presets.value.has(name) || !sessionState.loggedIn.value) {
        return
      }

      return await $fetch<InternalApi['/api/presets/:preset']['put']>(`/api/presets/${name}`, {
        method: 'PUT',
        body: currentPreset.value,
      })
    },
    onSuccess(result, name) {
      if (presets.value.has(name)) {
        return
      }

      presets.value.set(name, currentPreset.value)
      currentPresetId.value = name
    },
  })

  const deletePreset = useMutation({
    async mutationFn(name: string) {
      if (name === defaultPresetName || !sessionState.loggedIn.value) {
        return
      }
      return await $fetch<[InternalApi['/api/presets/:preset']['delete']]>(`/api/presets/${name}`, {
        method: 'DELETE',
      })
    },
    onSuccess(result, name) {
      if (name === defaultPresetName) {
        return
      }

      presets.value.delete(name)
      if (currentPresetId.value === name) {
        currentPresetId.value = defaultPresetName
      }
    },
  })

  const renamePreset = useMutation({
    async mutationFn({ from, to }: { from: string; to: string }) {
      if (from === to || !sessionState.loggedIn.value) {
        return
      }
      const fromVal = presets.value.get(from)
      if (fromVal) {
        return await $fetch<InternalApi['/api/presets/rename']['post']>('/api/presets/rename', {
          method: 'POST',
          body: {
            from,
            to,
          },
        })
      }
    },

    onSuccess(result, { from, to }) {
      if (from === to) {
        return
      }

      const fromVal = presets.value.get(from)
      if (fromVal) {
        presets.value.set(to, fromVal)
        if (currentPresetId.value === from) {
          currentPresetId.value = to
        }
        presets.value.delete(from)
      }
    },
  })

  return {
    presets,
    presetsUpdated: lastUpdated,
    currentPresetId,
    currentPreset,
    updates,
    dataFetched,
    defaultExistsOnServer,
    fetchData,
    fetchLocalData,
    newPreset,
    deletePreset,
    renamePreset,
    markUpdate,
    runUpdate,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePresetStore, import.meta.hot))
}
