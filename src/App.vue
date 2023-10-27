<template>
  <b-container>
    <h1>Work time calc</h1>

    <BForm>
      <div class="row">
        <div class="col-lg-1">
          <label for="savedUpTimeInput">Saved up time:</label>
          <BFormInput id="savedUpTimeInput" class="mb-2 me-sm-2 mb-sm-0" v-model="savedUp"></BFormInput>
        </div>

        <div class="col-lg-1">
          <label for="workTimeInput">Work time:<br />&nbsp;</label>
          <BFormInput id="workTimeInput" class="mb-2 me-sm-2 mb-sm-0" v-model="workTime"></BFormInput>
        </div>

        <div class="col-lg-1">
          <label for="defaultWorkFromInput">Default work from:</label>
          <BFormInput id="defaultWorkFromInput" class="mb-2 me-sm-2 mb-sm-0" v-model="defaultFrom"></BFormInput>
        </div>

        <div class="col-lg-1">
          <label for="defaultWorkToInput">Default work to:</label>
          <BFormInput id="defaultWorkToInput" class="mb-2 me-sm-2 mb-sm-0" v-model="defaultTo"></BFormInput>
        </div>

        <div class="col-lg-4">
          <label class="col" for="inputFile">Input:<br />&nbsp;</label>
          <BInputGroup>
            <BFormFile id="inputFile" accept="application/json" v-model="saveFile"></BFormFile>
            <template #append>
              <BButton type="button" @click="load">Load</BButton>
              <BButton type="button" @click="save">Save</BButton>
            </template>
          </BInputGroup>
        </div>

        <BButtonToolbar class="col-lg-4">
          <span>Actions:<br />&nbsp;</span>
          <BButtonGroup>
            <BButton type="button" variant="danger" @click="clear">Clear</BButton>
            <BButton type="button" variant="danger" @click="fillWorkdays">Fill workdays</BButton>
            <BButton type="button" @click="fillRemainingWorkdays">Add remaining workdays</BButton>
          </BButtonGroup>
        </BButtonToolbar>
      </div>
    </BForm>

    <hr />

    <BTableLite
      :fields="tableFields"
      :items="computedTableItems"
      dark="true"
      striped="true"
      :tbody-tr-class="bodyTrClasses"
    >
      <template #cell(day)="{ value, index }">
        <BFormInput
          :model-value="value as string"
          @update:model-value="(val) => (workDays[index].day = val)"
        ></BFormInput>
      </template>

      <template #cell(arrived)="{ value, index }">
        <BFormInput
          :model-value="value as string"
          @update:model-value="(val) => (workDays[index].from = val.length ? val : null)"
        ></BFormInput>
      </template>

      <template #cell(left)="{ value, index }">
        <BFormInput
          :model-value="value as string"
          @update:model-value="(val) => (workDays[index].to = val.length ? val : null)"
        ></BFormInput>
      </template>

      <template #cell(notes)="{ value, index }">
        <BFormInput
          :model-value="value as string"
          @update:model-value="(val) => (workDays[index].notes = val.length ? val : null)"
        ></BFormInput>
      </template>

      <template #cell(add_sub)="{ index }">
        <b-button @click="addRowAfter(index)">
          <font-awesome-icon :icon="['fas', 'plus']" />
        </b-button>
        <b-button v-if="workDays.length > 1" @click="removeRow(index)">
          <font-awesome-icon :icon="['fas', 'minus']" />
        </b-button>
      </template>
    </BTableLite>
  </b-container>
</template>

<script setup lang="ts">
import {
  BButton,
  BButtonGroup,
  BButtonToolbar,
  BContainer,
  BForm,
  BFormFile,
  BFormInput,
  BInputGroup,
  BTableLite,
  type TableField,
  type TableItem,
} from 'bootstrap-vue-next'
import { ref, watchSyncEffect } from 'vue'

import { computeWorkTime, type WorkDays, type WorkRange } from '@/ComputeWorkTime'
import Holidays from 'date-holidays'

const savedUp = ref('00:00')
const workTime = ref('08:00')
const defaultFrom = ref('08:45')
const defaultTo = ref('18:00')

function dateToString(d: Date) {
  const isoStr = d.toISOString()
  return isoStr.substring(0, isoStr.search('T'))
}

function currentDate() {
  return dateToString(new Date())
}

const workDays = ref<(WorkRange & { day: string })[]>([{ day: currentDate(), from: null, to: null }])

function addRowAfter(idx: number) {
  const prevDay = workDays.value[idx]
  const day = prevDay ? prevDay.day : currentDate()
  workDays.value.splice(idx + 1, 0, { day, from: defaultFrom.value, to: null })
}

function removeRow(idx: number) {
  workDays.value.splice(idx, 1)
}

function clear() {
  workDays.value = [{ day: currentDate(), from: defaultFrom.value, to: defaultTo.value }]
}

function fillWorkdaysBase(start: Date) {
  const hd = new Holidays('DK')

  const monthDates: Date[] = []
  let date = new Date(start)
  let i = 0
  while (date.getMonth() === start.getMonth()) {
    monthDates.push(new Date(date))
    date.setDate(date.getDate() + 1)
    i += 1
    if (i > 31) {
      console.error(date)
      throw new Error('Did not stop when expected')
    }
  }

  return monthDates.filter((d) => !hd.isHoliday(d) && d.getDay() !== 0 && d.getDay() !== 6)
}

function fillWorkdays() {
  const dates = fillWorkdaysBase(new Date(workDays.value[0].day))
  workDays.value = dates.map((d) => ({ day: dateToString(d), from: null, to: null }))
}

function fillRemainingWorkdays() {
  const start = new Date(workDays.value[workDays.value.length - 1].day)
  start.setDate(start.getDate() + 1)
  const dates = fillWorkdaysBase(start)
  workDays.value.push(...dates.map((d) => ({ day: dateToString(d), from: null, to: null })))
}

const tableFields: TableField[] = [
  {
    key: 'day',
    label: 'Day',
    thStyle: 'min-width: 130px',
  },
  {
    key: 'arrived',
    label: 'Arrived',
    thStyle: 'min-width: 80px',
  },
  {
    key: 'left',
    label: 'Left',
    thStyle: 'min-width: 80px',
  },
  {
    key: 'worked_time',
    label: 'Worked time',
    thStyle: 'min-width: 80px',
  },
  {
    key: 'extra_time',
    label: 'Extra time',
    thStyle: 'min-width: 80px',
  },
  {
    key: 'lost_time',
    label: 'Lost time',
    thStyle: 'min-width: 80px',
  },
  {
    key: 'estimate',
    label: 'Is estimate',
    thStyle: 'min-width: 90px',
  },
  {
    key: 'subtracted_time',
    label: 'Subtracted time',
    thStyle: 'min-width: 80px',
  },
  {
    key: 'notes',
    label: 'Notes',
    thStyle: 'min-width: 300px',
  },
  {
    key: 'add_sub',
    label: 'Add/Remove row',
    thStyle: 'min-width: 70px',
  },
]

const computedTableItems = ref<
  {
    day: string
    arrived: string | null
    left: string | null
    worked_time: string
    extra_time: string
    lost_time: string
    estimate: boolean
    subtracted_time: string
    notes: string
    add_sub: string
  }[]
>([])
watchSyncEffect(() => {
  const workDaysObj: WorkDays = {}
  for (const workDay of workDays.value) {
    if (workDay) {
      if (!workDaysObj[workDay.day]) {
        workDaysObj[workDay.day] = []
      }
      workDaysObj[workDay.day].push(workDay)
    }
  }

  try {
    const computedWorkDays = computeWorkTime(
      workDaysObj,
      savedUp.value,
      defaultFrom.value,
      defaultTo.value,
      workTime.value,
    )

    computedTableItems.value = computedWorkDays.map((entry) => ({
      day: entry.day,
      arrived: entry.from,
      left: entry.to,
      worked_time: entry.workedTime,
      extra_time: entry.extraTime,
      lost_time: entry.lostTime,
      estimate: entry.estimate,
      subtracted_time: entry.subtractedTime,
      notes: entry.notes,
      add_sub: '',
    }))
  } catch (e) {
    //Ignored
  }
})

function bodyTrClasses(item: TableItem | null, type: string) {
  if (type === 'row' && item) {
    const day = item.day as string
    const idx = workDays.value.findIndex((v) => v.day === day)
    if (idx > 0) {
      const prevDay = workDays.value[idx - 1].day
      if (new Date(day).getDate() - new Date(prevDay).getDate() > 1) {
        return 'table-group-divider'
      }
    }
  }

  return null
}

const saveFile = ref<null | File>(null)

async function load() {
  const file = saveFile.value
  if (file) {
    const text = await file.text()
    const json = JSON.parse(text)
    savedUp.value = json.savedUp
    workTime.value = json.workTime
    defaultFrom.value = json.defaultFrom
    defaultTo.value = json.defaultTo
    workDays.value = json.workDays
  }
}

function save() {
  const data = {
    savedUp: savedUp.value,
    workTime: workTime.value,
    defaultFrom: defaultFrom.value,
    defaultTo: defaultTo.value,
    workDays: workDays.value,
  }

  // https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = saveFile.value?.name ?? 'data.json'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}
</script>