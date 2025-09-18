interface PresetPart {
  workTime: string
  defaultFrom: string
  defaultTo: string
  precision: number
  tags: Map<string, string>
}

interface Preset {
  hours: PresetPart
  tasks: PresetPart
}

export const usePresetStore = defineStore('presetStore', () => {
  function useStorageWithId<T>(name: string, defaultVal: () => T) {
    return useLocalStorage(`presets.${name}`, defaultVal, {
      writeDefaults: false,
    })
  }

  const presets = useStorageWithId<Map<string, Preset>>(
    'presets',
    () =>
      new Map<string, Preset>([
        [
          'Default',
          {
            hours: {
              workTime: '08:00',
              defaultFrom: '08:45',
              defaultTo: '17:00',
              precision: 5,
              tags: new Map()
            },
            tasks: {
              workTime: '00:00',
              defaultFrom: '00:00',
              defaultTo: '00:00',
              precision: 10,
              tags: new Map()
            },
          },
        ],
      ]),
  )
  const currentPresetId = useStorageWithId('current', () => 'Default')
  const currentPreset = computed<Preset, Preset>({
    get() {
      return presets.value.get(currentPresetId.value)!
    },
    set(value) {
      presets.value.set(currentPresetId.value, value)
    },
  })

  function newPreset(name: string) {
    if (name in presets.value) {
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
