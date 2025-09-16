import { Intl as TemporalIntl, Temporal } from '@js-temporal/polyfill'

interface Defaults {
  workTime: string
  defaultFrom: string
  defaultTo: string
  precision: number
}

const hoursDefaults: Defaults = {
  workTime: '08:00',
  defaultFrom: '08:45',
  defaultTo: '17:00',
  precision: 5,
}
const tasksDefaults: Defaults = {
  workTime: '00:00',
  defaultFrom: '00:00',
  defaultTo: '00:00',
  precision: 10,
}

function getDefaults(storeId: string, mode: 'tasks' | 'hours'): Defaults {
  if (storeId === `default-${mode}`) {
    return mode === 'hours' ? hoursDefaults : tasksDefaults
  } else {
    const defaultStore = useSettingsStore(`default-${mode}`, mode)
    return {
      workTime: defaultStore.workTime,
      defaultFrom: defaultStore.defaultFrom,
      defaultTo: defaultStore.defaultTo,
      precision: defaultStore.precision,
    }
  }
}

export const useSettingsStore = (storeId: string, startingMode?: 'tasks' | 'hours') => {
  const store = defineStore(`settings-${storeId}`, () => {
    function useStorageWithId<T>(name: string, defaultVal: () => T) {
      return useLocalStorage(`settings.${storeId}.${name}`, defaultVal, {
        writeDefaults: false,
      })
    }

    const mode = useStorageWithId<'hours' | 'tasks'>('mode', () => startingMode ?? 'hours')

    const defaults = computed<Defaults>(() => getDefaults(storeId, mode.value))
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

    const tagColors = useStorageWithId<Record<string, string>>('tagColors', () => ({}))

    function getTagColor(tag: string) {
      const existing = tagColors.value[tag]
      if (existing) {
        return existing
      }

      const color = '#' + Math.floor(Math.random() * 16777215).toString(16)
      tagColors.value[tag] = color
      return color
    }

    function deleteTag(tag: string) {
      delete tagColors.value[tag]
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
