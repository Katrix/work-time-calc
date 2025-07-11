import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = (storeId: string) => {
  const store = defineStore(`settings-${storeId}`, () => {
    const mode = ref<'hours' | 'tasks'>('hours')
    const nameInput = ref('')
    const savedUpTime = ref('00:00')
    const savedUpVacation = ref('0')
    const workTime = ref('08:00')
    const defaultFrom = ref('08:45')
    const defaultTo = ref('17:00')
    const saveFile = ref<null | File>(null)
    const precision = ref(5)

    function setModeHours() {
      mode.value = 'hours'
      workTime.value = '08:00'
      defaultFrom.value = '08:45'
      defaultTo.value = '17:00'
    }

    function setModeTasks() {
      mode.value = 'tasks'
      workTime.value = '00:00'
      defaultFrom.value = '00:00'
      defaultTo.value = '00:00'
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
      setModeHours,
      setModeTasks,
      switchMode,
      loadData,
    }
  })

  return store()
}
