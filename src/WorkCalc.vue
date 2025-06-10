<template>
  <div>
    <CalcSettings
      ref="settings"
      @load="load"
      @save="save"
      @save-csv="saveCSV"
      @clear="clear"
      @fill-workdays="fillWorkdays"
      @fill-remaining-workdays="fillRemainingWorkdays"
    ></CalcSettings>

    <hr />

    <CalcSized
      :custom-subtracted-time="workDays.map((d) => d.customSubtractedTime)"
      :tracking="workDays.map((d) => d.isTracking ?? false)"
      :computed-work-days="computedWorkDays"
      :mode="settings?.mode ?? 'hours'"
      @update:work-days-day="(idx, value) => (workDays[idx].day = value)"
      @update:work-days-from="(idx, value) => (workDays[idx].from = value)"
      @update:work-days-to="(idx, value) => (workDays[idx].to = value)"
      @update:work-days-subtracted-time="(idx, value) => (workDays[idx].subtractedTime = value)"
      @update:work-days-notes="(idx, value) => (workDays[idx].notes = value)"
      @update:work-days-tracking="(idx, value) => (workDays[idx].isTracking = value)"
      @add-row-after="addRowAfter"
      @remove-row="removeRow"
      @toggle-custom-subtracted-time="(idx) => (workDays[idx].customSubtractedTime = !workDays[idx].customSubtractedTime)"
    ></CalcSized>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchSyncEffect } from 'vue'
import { stringify as csvStringify } from 'csv-stringify/browser/esm/sync'

import Holidays from 'date-holidays'
import { type ComputedWorkEntries, computeWorkTime, type WorkDays, type WorkRange } from '@/ComputeWorkTime'
import CalcSettings from '@/CalcSettings.vue'
import CalcSized from '@/CalcSized.vue'

const settings = ref<InstanceType<typeof CalcSettings> | null>(null)
const workDays = ref<(WorkRange & { day: string; customSubtractedTime: boolean; isTracking?: boolean })[]>([
  { day: currentDate(), from: null, to: null, subtractedTime: null, customSubtractedTime: false },
])

const trackingFunId = ref<number>()

const nameComputed = computed(() => settings.value?.nameInput)

defineExpose({ name: nameComputed })

function dateToDateString(d: Date) {
  try {
    const isoStr = d.toISOString()
    return isoStr.substring(0, isoStr.search('T'))
  } catch (e) {
    return null
  }
}

function dateToTimeString(d: Date) {
  const hours = d.getHours().toString(10).padStart(2, '0')
  const minutes = d.getMinutes().toString(10).padStart(2, '0')
  return `${hours}:${minutes}`
}

function currentDate() {
  return dateToDateString(new Date()) as string
}

function currentTime() {
  return dateToTimeString(new Date())
}

onMounted(() => {
  trackingFunId.value = setInterval(() => {
    const t = currentTime()
    for (const workDay of workDays.value) {
      if (workDay.isTracking) {
        workDay.to = t
      }
    }
  }, 5000)
})

onUnmounted(() => {
  clearInterval(trackingFunId.value)
})

function addRowAfter(idx: number) {
  const prevDay = workDays.value[idx]
  let day: Date | string = new Date(prevDay ? prevDay.day : currentDate())
  if (isNaN(day.valueOf())) {
    day = prevDay.day
  } else {
    day.setDate(day.getDate() + 1)
  }

  workDays.value.splice(idx + 1, 0, {
    day: day instanceof Date ? dateToDateString(day) ?? '' : day,
    from: settings.value?.defaultFrom ?? null,
    to: null,
    subtractedTime: null,
    customSubtractedTime: false,
  })
}

function removeRow(idx: number) {
  workDays.value.splice(idx, 1)
}

function clear() {
  workDays.value = [
    {
      day: currentDate(),
      from: settings.value?.defaultFrom ?? null,
      to: settings.value?.defaultTo ?? null,
      subtractedTime: null,
      customSubtractedTime: false,
    },
  ]
}

function fillWorkdaysBase(start: Date) {
  const hd = new Holidays('DK')

  const monthDates: Date[] = []
  const date = new Date(start)
  let i = 0
  while (date.getMonth() === start.getMonth()) {
    monthDates.push(new Date(date))
    date.setDate(date.getDate() + 1)
    i += 1
    if (i > 31) {
      throw new Error(`Did not stop when expected ${date}`)
    }
  }

  return monthDates.filter((d) => !hd.isHoliday(d) && d.getDay() !== 0 && d.getDay() !== 6)
}

function fillWorkdays() {
  const dates = fillWorkdaysBase(new Date(workDays.value[0].day))
  workDays.value = dates.map((d) => ({
    day: dateToDateString(d) ?? '',
    from: null,
    to: null,
    subtractedTime: null,
    customSubtractedTime: false,
  }))
}

function fillRemainingWorkdays() {
  const start = new Date(workDays.value[workDays.value.length - 1].day)
  start.setDate(start.getDate() + 1)
  const dates = fillWorkdaysBase(start)
  workDays.value.push(
    ...dates.map((d) => ({
      day: dateToDateString(d) ?? '',
      from: null,
      to: null,
      subtractedTime: null,
      customSubtractedTime: false,
    })),
  )
}

const computedWorkDays = ref<ComputedWorkEntries[]>([])
watchSyncEffect(() => {
  const workDaysObj: WorkDays = {}
  for (const [idx, workDay] of workDays.value.entries()) {
    if (workDay) {
      if (!workDaysObj[workDay.day]) {
        workDaysObj[workDay.day] = []
      }
      workDaysObj[workDay.day].push({
        ...workDay,
        idx,
      })
    }
  }

  try {
    computedWorkDays.value = computeWorkTime(
      workDaysObj,
      settings.value?.savedUpTime ?? '00:00',
      settings.value?.defaultFrom ?? '00:00',
      settings.value?.defaultTo ?? '00:00',
      settings.value?.workTime ?? '00:00',
    ).sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))
  } catch (e) {
    // Ignored
  }
})

function fileName(extension: string) {
  const settingsV = settings.value
  return settingsV && settingsV.nameInput.length
    ? `${settingsV.nameInput}.${extension}`
    : settingsV?.saveFile?.name ?? `data.${extension}`
}

async function load() {
  const settingsV = settings.value
  const file = settingsV?.saveFile
  if (settingsV && file) {
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
      workDays: (WorkRange & { day: string; customSubtractedTime: boolean })[]
    }

    if (json.mode !== undefined && json.mode !== 'hours' && json.mode !== 'tasks') {
      throw new Error(`Invalid mode ${json.mode}`)
    }

    settingsV.loadData({
      mode: json.mode ?? 'hours',
      name: json.name ?? '',
      savedUpTime: json.savedUpTime ?? json.savedUp ?? '00:00',
      savedUpVacation: json.savedUpVacation ?? '0',
      workTime: json.workTime,
      defaultFrom: json.defaultFrom,
      defaultTo: json.defaultTo,
    })

    workDays.value = json.workDays
  }
}

function save() {
  const settingsV = settings.value
  if (!settingsV) {
    return
  }

  const data = {
    mode: settingsV.mode,
    name: settingsV.nameInput,
    savedUpTime: settingsV.savedUpTime,
    savedUpVacation: settingsV.savedUpVacation,
    workTime: settingsV.workTime,
    defaultFrom: settingsV.defaultFrom,
    defaultTo: settingsV.defaultTo,
    workDays: workDays.value,
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
  const settingsV = settings.value
  if (!settingsV) {
    return
  }

  const workDaysObj: WorkDays = {}
  for (const workDay of workDays.value) {
    if (workDay) {
      if (!workDaysObj[workDay.day]) {
        workDaysObj[workDay.day] = []
      }
      workDaysObj[workDay.day].push(workDay)
    }
  }

  const computedWorkTime = computeWorkTime(
    workDaysObj,
    settingsV.savedUpTime,
    settingsV.defaultFrom,
    settingsV.defaultTo,
    settingsV.workTime,
  )

  let computedWorkDays
  switch (settingsV.mode) {
    case 'hours':
      computedWorkDays = computedWorkTime.map((item) => ({
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
      computedWorkDays = computedWorkTime.map((item) => ({
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
