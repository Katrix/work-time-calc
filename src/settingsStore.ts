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

const hoursDefaults = {
  workTime: '08:00',
  defaultFrom: '08:45',
  defaultTo: '17:00',
  precision: 5,
}
const tasksDefaults = {
  workTime: '00:00',
  defaultFrom: '00:00',
  defaultTo: '00:00',
  precision: 10,
}

export const useSettingsStore = (storeId: string, startingMode?: 'tasks' | 'hours') => {
  const store = defineStore(`settings-${storeId}`, () => {
    function useStorageWithid<T>(name: string, defaultVal: MaybeRefOrGetter<T>) {
      return useStorage(`settings.${storeId}.${name}`, defaultVal)
    }

    const mode = useStorageWithid<'hours' | 'tasks'>('mode', startingMode ?? 'hours')

    const defaults = computed(() => (mode.value === 'hours' ? hoursDefaults : tasksDefaults))
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

    const tagColors = useStorageWithid<Record<string, string>>('tagColors', {})

    function getTagColor(tag: string) {
      const existing = tagColors.value[tag]
      if (existing) {
        return existing
      }

      const color = '#' + Math.floor(Math.random()*16777215).toString(16);
      tagColors.value[tag] = color
      return color
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
      getTagColor
    }
  })

  return store()
}
