import * as devalue from 'devalue'

export const usePresetStore = defineStore('presetStore', () => {
  const presets = ref<Map<string, Preset>>(
    new Map<string, Preset>([
      [
        'Default',
        {
          hours: {
            workTime: 8 * 60,
            defaultFrom: 8 * 60 + 45,
            defaultTo: 17 * 60,
            precision: 5,
            tags: new Map(),
            holidayRules: [
              { type: 'christmas' },
              { type: 'easter' },
              { type: 'ascension' },
              { type: 'pentecost' },
              { type: 'saturday' },
              { type: 'sunday' },
            ],
          },
          tasks: {
            workTime: 0,
            defaultFrom: 0,
            defaultTo: 0,
            precision: 10,
            tags: new Map(),
            holidayRules: [],
          },
          github: {
            owners: [],
            repos: new Map()
          }
        },
      ],
    ]),
  )
  const lastUpdated = ref(0)
  watch(
    presets,
    () => {
      lastUpdated.value = Date.now()

      if (import.meta.client) {
        localStorage.setItem(
          'presets',
          JSON.stringify({ lastUpdated: lastUpdated.value, data: devalue.stringify(presets.value) }),
        )
      }
    },
    { deep: true },
  )

  if (import.meta.client) {
    const presetsStr = localStorage.getItem('presets')
    nextTick(() => {
      if (presetsStr) {
        const presetsObj = JSON.parse(presetsStr)
        if (presetsObj.lastUpdated > lastUpdated.value) {
          presets.value = devalue.parse(presetsObj.data) as Map<string, Preset>
        }
      }
    })
  }

  const currentPresetId = ref('Default')
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
  }

  function deletePreset(name: string) {
    if (name === 'Default') {
      return
    }
    presets.value.delete(name)
    if (currentPresetId.value === name) {
      currentPresetId.value = 'Default'
    }
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
    }
  }

  return {
    presets,
    presetsUpdated: lastUpdated,
    currentPresetId,
    currentPreset,
    newPreset,
    deletePreset,
    renamePreset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePresetStore, import.meta.hot))
}
