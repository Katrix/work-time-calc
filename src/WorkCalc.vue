<template>
  <div>
    <CalcSettings :store-id="storeId" @load="load" @save="save" @save-csv="saveCSV"></CalcSettings>
    <hr />
    <CalcSized :store-id="storeId" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { stringify as csvStringify } from 'csv-stringify/browser/esm/sync'

import { currentTime, type WorkRange } from '@/ComputeWorkTime'
import CalcSettings from '@/CalcSettings.vue'
import CalcSized from '@/CalcSized.vue'
import { useSettingsStore } from '@/settingsStore.ts'
import { useEntriesStore } from '@/entriesStore.ts'

const storeId = window.crypto.randomUUID()

const settingsStore = useSettingsStore(storeId)
const entriesStore = useEntriesStore(storeId)

const trackingFunId = ref<number>()

const nameComputed = computed(() => settingsStore.nameInput)

defineExpose({ name: nameComputed })

onMounted(() => {
  trackingFunId.value = setInterval(() => {
    const t = currentTime(settingsStore.precision)
    for (const workDay of entriesStore.entries) {
      if (workDay.isTracking) {
        workDay.to = t
      }
    }
  }, 5000)
})

onUnmounted(() => {
  clearInterval(trackingFunId.value)
})

function fileName(extension: string) {
  return settingsStore.nameInput.length
    ? `${settingsStore.nameInput}.${extension}`
    : (settingsStore.saveFile?.name ?? `data.${extension}`)
}

async function load() {
  const file = settingsStore.saveFile
  if (file) {
    const text = await file.text()
    const json = JSON.parse(text) as {
      mode?: string
      name?: string
      savedUpTime?: string
      savedUp?: string
      savedUpVacation?: string
      workTime: string
      defaultFrom: string
      defaultTo: string
      workDays: (WorkRange & { customSubtractedTime: boolean })[]
    }

    if (json.mode !== undefined && json.mode !== 'hours' && json.mode !== 'tasks') {
      throw new Error(`Invalid mode ${json.mode}`)
    }

    settingsStore.loadData({
      mode: json.mode ?? 'hours',
      name: json.name ?? '',
      savedUpTime: json.savedUpTime ?? json.savedUp ?? '00:00',
      savedUpVacation: json.savedUpVacation ?? '0',
      workTime: json.workTime,
      defaultFrom: json.defaultFrom,
      defaultTo: json.defaultTo,
    })

    entriesStore.setEntries(json.workDays)
  }
}

function save() {
  const data = {
    mode: settingsStore.mode,
    name: settingsStore.nameInput,
    savedUpTime: settingsStore.savedUpTime,
    savedUpVacation: settingsStore.savedUpVacation,
    workTime: settingsStore.workTime,
    defaultFrom: settingsStore.defaultFrom,
    defaultTo: settingsStore.defaultTo,
    workDays: entriesStore.entries,
  }

  // https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = fileName('json')
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

function saveCSV() {
  let computedWorkDays
  switch (settingsStore.mode) {
    case 'hours':
      computedWorkDays = entriesStore.computedWorkDays.map((item) => ({
        day: item.day,
        from: item.from,
        to: item.to,
        workedTime: item.workedTime,
        extraTime: item.extraTime,
        lostTime: item.lostTime,
        subtractedTime: item.subtractedTime,
        notes: item.notes,
      }))
      break
    case 'tasks':
      computedWorkDays = entriesStore.computedWorkDays.map((item) => ({
        task: item.day,
        from: item.from,
        to: item.to,
        workedTime: item.workedTime,
        totalTime: item.extraTime,
        subtractedTime: item.subtractedTime,
        notes: item.notes,
      }))
      break
  }

  const str = csvStringify(computedWorkDays, { header: true })

  // https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
  const blob = new Blob([str], { type: 'text/csv' })
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = fileName('csv')
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}
</script>
