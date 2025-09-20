<template>
  <div>
    <CalcSettings :store-id="calcId" @load="load" @save="save" @save-csv="saveCSV"></CalcSettings>
    <hr />
    <CalcSized :calc-id="calcId" />
  </div>
</template>

<script setup lang="ts">
import { stringify as csvStringify } from 'csv-stringify/browser/esm/sync'

const props = defineProps<{
  calcId: string
}>()

const calcStore = useCalcStore()
const { calc, computedCalc, loadData } = calcStore.useCalc(computed(() => props.calcId))

const trackingFunId = ref<number>()

onMounted(() => {
  function updateTracking() {
    const t = currentTime(calc.value.precision)
    for (const workDay of calc.value.entries) {
      if (workDay.isTracking) {
        workDay.to = t
      }
    }
  }

  trackingFunId.value = setInterval(updateTracking, 500)
  updateTracking()
})

onUnmounted(() => {
  clearInterval(trackingFunId.value)
})

function fileName(extension: string) {
  return calc.value.name.length
    ? `${calc.value.name}.${extension}`
    : (calcStore.saveFiles.get(props.calcId)?.name ?? `data.${extension}`)
}

async function load() {
  const file = calcStore.saveFiles.get(props.calcId)
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

    loadData(
      {
        mode: json.mode ?? 'hours',
        name: json.name ?? '',
        savedUpTime: json.savedUpTime ?? json.savedUp ?? '00:00',
        savedUpVacation: json.savedUpVacation ?? '0',
        workTime: json.workTime,
        defaultFrom: json.defaultFrom,
        defaultTo: json.defaultTo,
      },
      json.workDays,
    )
  }
}

function save() {
  const data = {
    mode: calc.value.mode,
    name: calc.value.name,
    savedUpTime: calc.value.savedUpTime,
    savedUpVacation: calc.value.savedUpVacation,
    workTime: calc.value.workTime,
    defaultFrom: calc.value.defaultFrom,
    defaultTo: calc.value.defaultTo,
    workDays: calc.value.entries,
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
  switch (calc.value.mode) {
    case 'hours':
      computedWorkDays = (computedCalc.value?.entries ?? []).map((item) => ({
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
      computedWorkDays = (computedCalc.value?.entries ?? []).map((item) => ({
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
