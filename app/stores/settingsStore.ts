import { Intl as TemporalIntl, Temporal } from '@js-temporal/polyfill'

export const useSettingsStore = (storeId: string, startingMode?: 'tasks' | 'hours') => {
  const store = defineStore(`settings-${storeId}`, () => {
    function useStorageWithId<T>(name: string, defaultVal: () => T) {
      return useLocalStorage(`settings.${storeId}.${name}`, defaultVal, {
        writeDefaults: false,
      })
    }
    const presetStore = usePresetStore()

    const mode = useStorageWithId<'hours' | 'tasks'>('mode', () => startingMode ?? 'hours')

    const defaults = computed(() => presetStore.currentPreset[mode.value])
    const nameDefault = computed(() => {
      const now = Temporal.Now.plainDateISO()
      if (mode.value === 'hours') {
        const monthName = new TemporalIntl.DateTimeFormat('en', { month: 'long' }).format(now)
        return `${now.year}-${now.month}-${monthName}`
      } else {
        return now.toString()
      }
    })

    const nameInput = useStorageWithId('name', () => nameDefault.value)
    const savedUpTime = useStorageWithId('savedUpTime', () => '00:00')
    const savedUpVacation = useStorageWithId('savedUpVacation', () => '0')
    const workTime = useStorageWithId('workTime', () => defaults.value.workTime)
    const defaultFrom = useStorageWithId('defaultFrom', () => defaults.value.defaultFrom)
    const defaultTo = useStorageWithId('defaultTo', () => defaults.value.defaultTo)
    const saveFile = ref<null | File>(null)
    const precision = useStorageWithId('precision', () => defaults.value.precision)

    function setDefaults() {
      workTime.value = defaults.value.workTime
      defaultFrom.value = defaults.value.defaultFrom
      defaultTo.value = defaults.value.defaultTo
      precision.value = defaults.value.precision
    }

    function setModeHours() {
      const oldNameDefault = nameDefault.value
      mode.value = 'hours'
      setDefaults()
      if (nameInput.value === oldNameDefault) {
        nameInput.value = nameDefault.value
      }
    }

    function setModeTasks() {
      const oldNameDefault = nameDefault.value
      mode.value = 'tasks'
      setDefaults()
      if (nameInput.value === oldNameDefault) {
        nameInput.value = nameDefault.value
      }
    }

    function switchMode() {
      if (mode.value === 'hours') {
        setModeTasks()
      } else {
        setModeHours()
      }
    }

    function loadData(data: {
      mode: 'hours' | 'tasks'
      name: string
      savedUpTime: string
      savedUpVacation: string
      workTime: string
      defaultFrom: string
      defaultTo: string
    }) {
      mode.value = data.mode
      nameInput.value = data.name
      savedUpTime.value = data.savedUpTime
      savedUpVacation.value = data.savedUpVacation
      workTime.value = data.workTime
      defaultFrom.value = data.defaultFrom
      defaultTo.value = data.defaultTo
    }

    const tagColors = useStorageWithId<Map<string, { color: string; fromPreset?: boolean }>>(
      'tagColors',
      () => new Map(defaults.value.tags.entries().map(([k, color]) => [k, { color, fromPreset: true }])),
    )

    function getTagColor(tag: string) {
      const existing = tagColors.value.get(tag)
      if (existing) {
        return existing.color
      }

      const color = '#' + Math.floor(Math.random() * 16777215).toString(16)
      tagColors.value.set(tag, { color })
      return color
    }

    function deleteTag(tagName: string, { deleteConfigured }: { deleteConfigured: boolean }) {
      const tag = tagColors.value.get(tagName)
      if (tag && tag.fromPreset && !deleteConfigured) {
        return
      }
      tagColors.value.delete(tagName)
    }

    return {
      mode,
      nameInput,
      savedUpTime,
      savedUpVacation,
      workTime,
      defaultFrom,
      defaultTo,
      saveFile,
      precision,
      tagColors,
      switchMode,
      loadData,
      getTagColor,
      deleteTag,
    }
  })

  if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(store, import.meta.hot))
  }

  return store()
}
