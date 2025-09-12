import { defineStore } from 'pinia'
import { computed, type MaybeRefOrGetter, ref, watchEffect } from 'vue'
import { useLocalStorage, useStorage } from '@vueuse/core'
import { Intl as TemporalIntl, Temporal } from '@js-temporal/polyfill'

interface SavedDefaults {
  workTime: string
  defaultFrom: string
  defaultTo: string
  precision: number
}

const hoursDefaults = useLocalStorage<SavedDefaults>(
  'settings-default-hours',
  {
    workTime: '08:00',
    defaultFrom: '08:45',
    defaultTo: '17:00',
    precision: 5,
  },
  { mergeDefaults: true, listenToStorageChanges: true, writeDefaults: true },
)
const tasksDefaults = useLocalStorage<SavedDefaults>(
  'settings-default-tasks',
  {
    workTime: '00:00',
    defaultFrom: '00:00',
    defaultTo: '00:00',
    precision: 10,
  },
  { mergeDefaults: true, listenToStorageChanges: true, writeDefaults: true },
)

export const useSettingsStore = (storeId: string, startingMode?: 'tasks' | 'hours') => {
  const store = defineStore(`settings-${storeId}`, () => {
    function useStorageWithid<T>(name: string, defaultVal: MaybeRefOrGetter<T>) {
      return useStorage(`settings.${storeId}.${name}`, defaultVal)
    }

    const mode = useStorageWithid<'hours' | 'tasks'>('mode', startingMode ?? 'hours')

    const defaults = computed(() => (mode.value === 'hours' ? hoursDefaults.value : tasksDefaults.value))
    const nameDefault = computed(() => {
      const now = Temporal.Now.plainDateISO()
      if (mode.value === 'hours') {
        const monthName = new TemporalIntl.DateTimeFormat('en', { month: 'long' }).format(now)
        return `${now.year}-${now.month}-${monthName}`
      } else {
        return now.toString()
      }
    })

    const nameInput = useStorageWithid('name', nameDefault.value)
    const savedUpTime = useStorageWithid('savedUpTime', '00:00')
    const savedUpVacation = useStorageWithid('savedUpVacation', '0')
    const workTime = useStorageWithid('workTime', defaults.value.workTime)
    const defaultFrom = useStorageWithid('defaultFrom', defaults.value.defaultFrom)
    const defaultTo = useStorageWithid('defaultTo', defaults.value.defaultTo)
    const saveFile = ref<null | File>(null)
    const precision = useStorageWithid('precision', defaults.value.precision)

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

    if (storeId.startsWith('default')) {
      watchEffect(() => {
        const defaults = mode.value === 'hours' ? hoursDefaults : tasksDefaults
        defaults.value = {
          workTime: workTime.value,
          defaultFrom: defaultFrom.value,
          defaultTo: defaultTo.value,
          precision: precision.value,
        }
      })
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
      switchMode,
      loadData,
    }
  })

  return store()
}
