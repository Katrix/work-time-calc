<template>
  <b-container fluid="xl" class="wider-container">
    <h1>Work time calc</h1>

    <BForm v-if="mode === 'hours'">
      <div class="hours-settings">
        <label style="grid-area: saved-up-time-description" for="savedUpTimeInput">Saved up time:</label>
        <div style="grid-area: saved-up-time-content">
          <BFormInput id="savedUpTimeInput" v-model="savedUpTime"></BFormInput>
        </div>

        <label style="grid-area: saved-up-vacation-description">Saved up vacation days:</label>
        <div style="grid-area: saved-up-vacation-content">
          <BFormInput id="savedUpVacationInput" v-model="savedUpVacation"></BFormInput>
        </div>

        <label style="grid-area: work-time-description" for="workTimeInput">Work time:</label>
        <div style="grid-area: work-time-content">
          <BFormInput id="workTimeInput" v-model="workTime"></BFormInput>
        </div>

        <label style="grid-area: default-work-from-description" for="defaultWorkFromInput">Default work from:</label>
        <div style="grid-area: default-work-from-content">
          <BFormInput id="defaultWorkFromInput" v-model="defaultFrom"></BFormInput>
        </div>

        <label style="grid-area: default-work-to-description" for="defaultWorkToInput">Default work to:</label>
        <div style="grid-area: default-work-to-content">
          <BFormInput id="defaultWorkToInput" v-model="defaultTo"></BFormInput>
        </div>

        <label style="grid-area: input-file-description" for="inputFile">Input:</label>
        <div style="grid-area: input-file-content">
          <BInputGroup>
            <BFormFile id="inputFile" v-model="saveFile" accept="application/json"></BFormFile>
            <template #append>
              <BButton type="button" :disabled="!saveFile" @click="load">Load</BButton>
              <BButton type="button" :disabled="!saveFile" @click="save">Save</BButton>
              <BButton type="button" :disabled="!saveFile" @click="saveCSV">SaveCSV</BButton>
            </template>
          </BInputGroup>
        </div>

        <span style="grid-area: actions-description">Actions:</span>
        <div style="grid-area: actions-content" class="d-flex justify-content-between">
          <BButtonToolbar>
            <BButtonGroup>
              <BButton type="button" variant="danger" @click="clear">Clear</BButton>
              <BButton type="button" variant="danger" @click="fillWorkdays">Fill workdays</BButton>
              <BButton type="button" @click="fillRemainingWorkdays">Add remaining workdays</BButton>
            </BButtonGroup>
          </BButtonToolbar>

          <BFormCheckbox :modelValue="true" @update:model-value="setModeTasks()" switch>Hours</BFormCheckbox>
        </div>
      </div>
    </BForm>
    <BForm v-else-if="mode === 'tasks'">
      <div class="tasks-settings">
        <label style="grid-area: input-file-description" for="inputFile">Input:</label>
        <div style="grid-area: input-file-content">
          <BInputGroup>
            <BFormFile id="inputFile" v-model="saveFile" accept="application/json"></BFormFile>
            <template #append>
              <BButton type="button" :disabled="!saveFile" @click="load">Load</BButton>
              <BButton type="button" :disabled="!saveFile" @click="save">Save</BButton>
              <BButton type="button" :disabled="!saveFile" @click="saveCSV">SaveCSV</BButton>
            </template>
          </BInputGroup>
        </div>

        <span style="grid-area: actions-description">Actions:</span>
        <div style="grid-area: actions-content" class="d-flex justify-content-between">
          <BButtonToolbar>
            <BButtonGroup>
              <BButton type="button" variant="danger" @click="clear">Clear</BButton>
            </BButtonGroup>
          </BButtonToolbar>

          <BFormCheckbox :modelValue="false" @update:model-value="setModeHours()" switch>Tasks</BFormCheckbox>
        </div>
      </div>
    </BForm>

    <hr />

    <div class="d-none d-lg-block" style="overflow-x: scroll">
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
          <BInputGroup>
            <BFormInput
              :model-value="value as string"
              @update:model-value="(val) => (workDays[index].from = val.length ? val : null)"
            ></BFormInput>
            <template #append>
              <BButton @click="workDays[index].from = currentTime()">
                <font-awesome-icon :icon="['fas', 'clock']" />
              </BButton>
            </template>
          </BInputGroup>
        </template>

        <template #cell(left)="{ value, index }">
          <BInputGroup>
            <BFormInput
              :model-value="value as string"
              @update:model-value="(val) => (workDays[index].to = val.length ? val : null)"
            ></BFormInput>
            <template #append>
              <BButton @click="workDays[index].to = currentTime()">
                <font-awesome-icon :icon="['fas', 'clock']" />
              </BButton>
            </template>
          </BInputGroup>
        </template>

        <template #cell(subtracted_time)="{ value, index }">
          <BInputGroup>
            <BFormInput
              :disabled="!workDays[index].customSubtractedTime"
              :model-value="value as string"
              @update:model-value="(val) => (workDays[index].subtractedTime = val.length ? val : null)"
            ></BFormInput>

            <template #prepend>
              <BButton @click="toggleSubtractedTime(index)">
                <font-awesome-layers fixed-width>
                  <font-awesome-icon
                    v-if="!workDays[index].customSubtractedTime"
                    :icon="['fas', 'slash']"
                    transform="down-1 left-1"
                  />
                  <font-awesome-icon
                    v-if="!workDays[index].customSubtractedTime"
                    :icon="['fas', 'slash']"
                    :mask="['fas', 'pen-to-square']"
                  />
                  <font-awesome-icon v-if="workDays[index].customSubtractedTime" :icon="['fas', 'pen-to-square']" />
                </font-awesome-layers>
              </BButton>
            </template>
          </BInputGroup>
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
    </div>
    <div class="d-lg-none">
      <BCard v-for="(item, index) in computedTableItems" class="mb-4">
        <template #header>
          <BFormInput :model-value="item.day" @update:model-value="(val) => (workDays[index].day = val)"></BFormInput>
        </template>

        <BCardText>
          <BFormGroup label="Arrived:">
            <BInputGroup>
              <BFormInput
                :model-value="item.arrived"
                @update:model-value="(val) => (workDays[index].from = val.length ? val : null)"
              >
              </BFormInput>
              <template #append>
                <BButton @click="workDays[index].from = currentTime()">
                  <font-awesome-icon :icon="['fas', 'clock']" />
                </BButton>
              </template>
            </BInputGroup>
          </BFormGroup>

          <BFormGroup label="Left:" class="mb-2">
            <BInputGroup>
              <BFormInput
                :model-value="item.left"
                @update:model-value="(val) => (workDays[index].to = val.length ? val : null)"
              >
              </BFormInput>
              <template #append>
                <BButton @click="workDays[index].to = currentTime()">
                  <font-awesome-icon :icon="['fas', 'clock']" />
                </BButton>
              </template>
            </BInputGroup>
          </BFormGroup>

          <dl class="row">
            <dt class="col-5">Worked time:</dt>
            <dd class="col-7">{{ item.worked_time }}</dd>
            <dt class="col-5">Extra time:</dt>
            <dd class="col-7">{{ item.extra_time }}</dd>
            <dt class="col-5">Lost time:</dt>
            <dd class="col-7">{{ item.lost_time }}</dd>
            <dt class="col-5">Estimate?:</dt>
            <dd class="col-7">{{ item.estimate }}</dd>
          </dl>

          <BFormGroup label="Subtracted time:">
            <BInputGroup>
              <BFormInput
                :disabled="!workDays[index].customSubtractedTime"
                :model-value="item.subtracted_time"
                @update:model-value="(val) => (workDays[index].subtractedTime = val.length ? val : null)"
              ></BFormInput>

              <template #prepend>
                <BButton @click="toggleSubtractedTime(index)">
                  <font-awesome-layers fixed-width>
                    <font-awesome-icon
                      v-if="!workDays[index].customSubtractedTime"
                      :icon="['fas', 'slash']"
                      transform="down-1 left-1"
                    />
                    <font-awesome-icon
                      v-if="!workDays[index].customSubtractedTime"
                      :icon="['fas', 'slash']"
                      :mask="['fas', 'pen-to-square']"
                    />
                    <font-awesome-icon v-if="workDays[index].customSubtractedTime" :icon="['fas', 'pen-to-square']" />
                  </font-awesome-layers>
                </BButton>
              </template>
            </BInputGroup>
          </BFormGroup>

          <BFormGroup label="Notes:">
            <BFormInput
              :model-value="item.notes"
              @update:model-value="(val) => (workDays[index].notes = val.length ? val : null)"
            ></BFormInput>
          </BFormGroup>
        </BCardText>

        <template #footer>
          <b-button @click="addRowAfter(index)">
            <font-awesome-icon :icon="['fas', 'plus']" />
          </b-button>
          <b-button v-if="workDays.length > 1" @click="removeRow(index)">
            <font-awesome-icon :icon="['fas', 'minus']" />
          </b-button>
        </template>
      </BCard>
    </div>
  </b-container>
</template>

<script setup lang="ts">
import {
  BButton,
  BButtonGroup,
  BButtonToolbar,
  BContainer,
  BForm,
  BFormGroup,
  BFormFile,
  BFormInput,
  BFormCheckbox,
  BInputGroup,
  BTableLite,
  BCard,
  BCardText,
  type TableField,
  type TableItem,
} from 'bootstrap-vue-next'
import { computed, ref, watchSyncEffect } from "vue";
import { stringify as csvStringify } from 'csv-stringify/browser/esm/sync'

import Holidays from 'date-holidays'
import { computeWorkTime, type WorkDays, type WorkRange } from '@/ComputeWorkTime'
import type { ComputedRef } from "@vue/reactivity";

const mode = ref<'hours' | 'tasks'>('hours')
const savedUpTime = ref('00:00')
const savedUpVacation = ref('0')
const workTime = ref('08:00')
const defaultFrom = ref('08:45')
const defaultTo = ref('17:00')

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

function dateToDateString(d: Date) {
  try {
    const isoStr = d.toISOString()
    return isoStr.substring(0, isoStr.search('T'))
  } catch (e) {
    return null
  }
}

function dateToTimeString(d: Date) {
  const hours = d.getHours()
  const minutes = d.getMinutes()
  return `${hours}:${minutes.toString(10).padStart(2, '0')}`
}

function currentDate() {
  return dateToDateString(new Date()) as string
}

function currentTime() {
  return dateToTimeString(new Date())
}

const workDays = ref<(WorkRange & { day: string; customSubtractedTime: boolean })[]>([
  { day: currentDate(), from: null, to: null, subtractedTime: null, customSubtractedTime: false },
])

function toggleSubtractedTime(idx: number) {
  workDays.value[idx].customSubtractedTime = !workDays.value[idx].customSubtractedTime

  if (!workDays.value[idx].customSubtractedTime) {
    workDays.value[idx].subtractedTime = null
  }
}

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
    from: defaultFrom.value,
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
      from: defaultFrom.value,
      to: defaultTo.value,
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
      console.error(date)
      throw new Error('Did not stop when expected')
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

const tableFields: ComputedRef<TableField[]> = computed(() => {
  if (mode.value === 'hours') {
    return [
      {
        key: 'day',
        label: 'Day',
        thStyle: 'min-width: 130px',
      },
      {
        key: 'arrived',
        label: 'Arrived',
        thStyle: 'min-width: 120px',
      },
      {
        key: 'left',
        label: 'Left',
        thStyle: 'min-width: 120px',
      },
      {
        key: 'worked_time',
        label: 'Worked time',
        thStyle: 'min-width: 60px',
      },
      {
        key: 'extra_time',
        label: 'Extra time',
        thStyle: 'min-width: 60px',
      },
      {
        key: 'lost_time',
        label: 'Lost time',
        thStyle: 'min-width: 60px',
      },
      {
        key: 'estimate',
        label: 'Estimate?',
        thStyle: 'min-width: 40px',
      },
      {
        key: 'subtracted_time',
        label: 'Subtracted time',
        thStyle: 'min-width: 125px',
      },
      {
        key: 'notes',
        label: 'Notes',
        thStyle: 'min-width: 200px',
      },
      {
        key: 'add_sub',
        label: 'Add/Remove row',
        thStyle: 'min-width: 80px',
      },
    ]
  } else {
    return [
      {
        key: 'day',
        label: 'Task',
        thStyle: 'min-width: 130px',
      },
      {
        key: 'arrived',
        label: 'From',
        thStyle: 'min-width: 120px',
      },
      {
        key: 'left',
        label: 'To',
        thStyle: 'min-width: 120px',
      },
      {
        key: 'worked_time',
        label: 'Worked time',
        thStyle: 'min-width: 60px',
      },
      {
        key: 'extra_time',
        label: 'Total time',
        thStyle: 'min-width: 60px',
      },
      {
        key: 'subtracted_time',
        label: 'Subtracted time',
        thStyle: 'min-width: 125px',
      },
      {
        key: 'notes',
        label: 'Notes',
        thStyle: 'min-width: 200px',
      },
      {
        key: 'add_sub',
        label: 'Add/Remove row',
        thStyle: 'min-width: 80px',
      },
    ]
  }
})

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
  for (const [idx, workDay] of workDays.value.entries()) {
    if (workDay) {
      if (!workDaysObj[workDay.day]) {
        workDaysObj[workDay.day] = []
      }
      workDaysObj[workDay.day].push({
        ...workDay,
        idx
      })
    }
  }

  try {
    const computedWorkDays = computeWorkTime(
      workDaysObj,
      savedUpTime.value,
      defaultFrom.value,
      defaultTo.value,
      workTime.value,
    ).sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))

    computedTableItems.value = computedWorkDays.map((entry) => ({
      day: entry.day,
      arrived: entry.from,
      left: entry.to,
      worked_time: entry.workedTime,
      //time_diff: entry.timeDiff,
      extra_time: entry.extraTime,
      lost_time: entry.lostTime,
      estimate: entry.estimate,
      subtracted_time: entry.subtractedTime,
      notes: entry.notes,
      add_sub: '',
    }))
  } catch (e) {
    // Ignored
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
    savedUpTime.value = json.savedUpTime ?? json.savedUp
    savedUpVacation.value = json.savedUpVacation ?? '0'
    workTime.value = json.workTime
    defaultFrom.value = json.defaultFrom
    defaultTo.value = json.defaultTo
    workDays.value = json.workDays
  }
}

function save() {
  const data = {
    savedUpTime: savedUpTime.value,
    savedUpVacation: savedUpVacation.value,
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

function saveCSV() {
  const workDaysObj: WorkDays = {}
  for (const workDay of workDays.value) {
    if (workDay) {
      if (!workDaysObj[workDay.day]) {
        workDaysObj[workDay.day] = []
      }
      workDaysObj[workDay.day].push(workDay)
    }
  }

  const computedWorkDays = computeWorkTime(
    workDaysObj,
    savedUpTime.value,
    defaultFrom.value,
    defaultTo.value,
    workTime.value,
  ).map((item) => {
    if (mode.value === 'hours') {
      return {
        day: item.day,
        from: item.from,
        to: item.to,
        workedTime: item.workedTime,
        extraTime: item.extraTime,
        lostTime: item.lostTime,
        subtractedTime: item.subtractedTime,
        notes: item.notes,
      }
    } else if (mode.value === 'tasks') {
      return {
        task: item.day,
        from: item.from,
        to: item.to,
        workedTime: item.workedTime,
        totalTime: item.extraTime,
        subtractedTime: item.subtractedTime,
        notes: item.notes,
      }
    }
  })

  const str = csvStringify(computedWorkDays, { header: true })

  // https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
  const blob = new Blob([str], { type: 'text/csv' })
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = 'data.csv'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}
</script>
