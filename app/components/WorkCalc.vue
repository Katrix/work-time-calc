<template>
  <div>
    <CalcSettings :store-id="storeId" @load="load" @save="save" @save-csv="saveCSV"></CalcSettings>
    <hr />
    <CalcSized :store-id="storeId" />
  </div>
</template>

<script setup lang="ts">
import { stringify as csvStringify } from 'csv-stringify/browser/esm/sync'

const props = defineProps<{
  storeId: string
}>()

const settingsStore = computed(() => useSettingsStore(props.storeId))
const entriesStore = computed(() => useEntriesStore(props.storeId))

const trackingFunId = ref<number>()

onMounted(() => {
  trackingFunId.value = setInterval(() => {
    const t = currentTime(settingsStore.value.precision)
    for (const workDay of entriesStore.value.entries) {
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
  return settingsStore.value.nameInput.length
    ? `${settingsStore.value.nameInput}.${extension}`
    : (settingsStore.value.saveFile?.name ?? `data.${extension}`)
}

async function load() {
  const file = settingsStore.value.saveFile
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

    settingsStore.value.loadData({
      mode: json.mode ?? 'hours',
      name: json.name ?? '',
      savedUpTime: json.savedUpTime ?? json.savedUp ?? '00:00',
      savedUpVacation: json.savedUpVacation ?? '0',
      workTime: json.workTime,
      defaultFrom: json.defaultFrom,
      defaultTo: json.defaultTo,
    })

    entriesStore.value.setEntries(json.workDays)
  }
}

function save() {
  const ss = settingsStore.value
  const data = {
    mode: ss.mode,
    name: ss.nameInput,
    savedUpTime: ss.savedUpTime,
    savedUpVacation: ss.savedUpVacation,
    workTime: ss.workTime,
    defaultFrom: ss.defaultFrom,
    defaultTo: ss.defaultTo,
    workDays: entriesStore.value.entries,
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
  switch (settingsStore.value.mode) {
    case 'hours':
      computedWorkDays = entriesStore.value.computedWorkDays.map((item) => ({
        day: item.day,
        from: item.from,
        to: item.to,
        workedTime: item.workedTime,
        extraTime: item.extraTime,
        subtractedTime: item.subtractedTime,
        notes: item.notes,
      }))
      break
    case 'tasks':
      computedWorkDays = entriesStore.value.computedWorkDays.map((item) => ({
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
