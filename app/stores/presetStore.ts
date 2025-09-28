import * as devalue from 'devalue'
import z from 'zod'
import { allVersionsPreset } from '#shared/types/preset'

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

  async function fetchData() {
    const res = await $fetch('/api/presets')
    presets.value = new Map(Object.entries(z.record(z.string(), presetV2).parse(res.presets)))
    lastUpdated.value = new Date(res.lastUpdated).getTime()
    currentPresetId.value = res.currentPreset ?? defaultPresetName

    const presetsStr = localStorage.getItem('presets')
    if (presetsStr) {
      const schema = z.object({
        lastUpdated: z.number(),
        data: z.string(),
      })

      const presetsObj = schema.safeParse(JSON.parse(presetsStr))
      if (presetsObj.data && presetsObj.data.lastUpdated > lastUpdated.value) {
        presets.value = z.map(z.string(), allVersionsPreset).parse(devalue.parse(presetsObj.data.data))
      }
      if (presetsObj.error) {
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
  async function runUpdate() {
    await Promise.all(
      [...updates.value.entries()].map(([name, types]) => {
        const preset = presets.value.get(name)
        if (!preset) {
          return
        }

        const distinctTypes = [...new Set(types)]
        if (distinctTypes.includes('all') || distinctTypes.length === allUpdateTypes.length - 1) {
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
                    body: preset.github,
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

    updates.value.clear()
  }

  const currentPresetId = ref(defaultPresetName)
  const currentPreset = computed<Preset, Preset>({
    get() {
      return presets.value.get(currentPresetId.value)!
    },
    set(value) {
      presets.value.set(currentPresetId.value, value)
    },
  })

  function newPreset(name: string) {
    if (presets.value.has(name)) {
      return
    }
    presets.value.set(name, JSON.parse(JSON.stringify(currentPreset.value)))
    $fetch(`/api/presets/${name}`, {
      method: 'PUT',
      body: currentPreset.value,
    })
  }

  function deletePreset(name: string) {
    if (name === defaultPresetName) {
      return
    }
    presets.value.delete(name)
    if (currentPresetId.value === name) {
      currentPresetId.value = defaultPresetName
    }
    $fetch(`/api/presets/${name}`, {
      method: 'DELETE',
    })
  }

  function renamePreset({ from, to }: { from: string; to: string }) {
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
      $fetch('/api/presets/rename', {
        method: 'POST',
        body: {
          from,
          to,
        },
      })
    }
  }

  return {
    presets,
    presetsUpdated: lastUpdated,
    currentPresetId,
    currentPreset,
    updates,
    fetchData,
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
