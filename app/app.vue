<template>
  <BApp>
    <div class="d-flex h-100">
      <Sidebar>
        <SidebarHeading is="h2" icon="folder-tree" text="Previous calcs" />
        <hr />
        <SidebarHeading is="h3" icon="calendar" text="Hours" />
        <SidebarDirectory :items="nestedHourCalcs.hoursEntries" />
        <hr />
        <SidebarHeading is="h3" icon="clock" text="Tasks" />
        <SidebarDirectory :items="nestedHourCalcs.tasksEntries" />
      </Sidebar>

      <BContainer fluid="xl" class="flex-fill container wider-container">
        <h1 class="d-flex justify-content-between">
          Work time calc

          <span>
            <AuthState v-slot="{ loggedIn, clear }">
              <BButton v-if="loggedIn" @click="clear()">Sign out</BButton>
              <BButton v-else variant="primary" href="/auth/github">Sign in with GitHub</BButton>
            </AuthState>
          </span>
        </h1>

        <ul class="nav nav-tabs" role="tablist">
          <li class="nav-item" role="presentation" v-for="(id, idx) in calcStore.calcOrder" :key="id">
            <NuxtLink class="nav-link" :to="{ name: 'calculation', params: { calculation: id } }" active-class="active">
              {{ calcStore.calcName(id, idx) }}
              <BButton variant="danger" size="sm" @click.prevent="calcStore.closeCalc(id)">
                <FontAwesomeIcon :icon="['fas', 'times']"></FontAwesomeIcon>
              </BButton>
            </NuxtLink>
          </li>

          <li class="nav-item" role="presentation">
            <NuxtLink class="nav-link" :to="{ name: 'settings' }">Settings</NuxtLink>
          </li>

          <li class="nav-item" role="presentation">
            <button class="nav-link" @click.prevent="calcStore.addCalc()"><b>+</b></button>
          </li>
        </ul>

        <NuxtPage />
        <NuxtRouteAnnouncer />
      </BContainer>
    </div>
  </BApp>
</template>

<script setup lang="ts">
import SidebarHeading from '~/components/sidebar/SidebarHeading.vue'
import SidebarDirectory from '~/components/sidebar/SidebarDirectory.vue'

const calcStore = useCalcStore()
const intervalId = ref<number>()
const now = useNow()
onMounted(() => {
  intervalId.value = setInterval(() => {
    now.value = new Date()
  }, 1000) as unknown as number
})
onUnmounted(() => clearInterval(intervalId.value))

const nestedHourCalcs = computed(() => {
  interface Entry {
    calcId: string
    name: string
  }

  const hoursRegexp = /(\d{4})-\d{2}-\w+/
  const tasksRegexp = /(\d{4})-(\d{2})-\d{2}/

  const yearsHours: number[] = []
  const yearEntriesHours = new Map<number, Entry[]>()

  const miscHours: Entry[] = []

  const yearsTasks: number[] = []
  const yearEntriesTasks = new Map<
    number,
    {
      months: number[]
      monthEntries: Map<number, Entry[]>
    }
  >()

  const miscTasks: Entry[] = []

  calcStore.calcs.forEach((calc, calcId) => {
    const name = calc.entry.value.name

    if (calc.entry.value.mode === 'hours') {
      const res = hoursRegexp.exec(name)
      if (res) {
        const year = Number(res[1])
        if (!yearsHours.includes(year)) {
          yearsHours.push(year)
        }

        let entries = yearEntriesHours.get(year)
        if (!entries) {
          entries = []
          yearEntriesHours.set(year, entries)
        }
        entries.push({ calcId, name })
      } else {
        miscHours.push({ calcId, name })
      }
    } else {
      const res = tasksRegexp.exec(name)
      if (res) {
        const year = Number(res[1])
        if (!yearsTasks.includes(year)) {
          yearsTasks.push(year)
        }

        let entries = yearEntriesTasks.get(year)
        if (!entries) {
          entries = { months: [], monthEntries: new Map() }
          yearEntriesTasks.set(year, entries)
        }

        const month = Number(res[2])
        if (!entries.months.includes(month)) {
          entries.months.push(month)
        }

        let monthEntries = entries.monthEntries.get(month)
        if (!monthEntries) {
          monthEntries = []
          entries.monthEntries.set(month, monthEntries)
        }

        monthEntries.push({ calcId, name })
      } else {
        miscTasks.push({ calcId, name })
      }
    }
  })

  yearsHours.sort((a, b) => b - a)
  yearsTasks.sort((a, b) => b - a)

  interface TextItem {
    icon: string
    text: string
    to?: RouteLocationRaw
  }
  type Item = TextItem | Item[]

  function entryToItem(entry: Entry): TextItem {
    return {
      icon: 'file',
      text: entry.name,
      to: {
        name: 'calculation',
        params: { calculation: entry.calcId },
      },
    }
  }

  const hoursItems: Item[] = yearsHours.flatMap((year) => {
    const items: TextItem[] = (yearEntriesHours.get(year) ?? []).map((entry) => entryToItem(entry))
    items.sort((a, b) => b.text.localeCompare(a.text))

    return [{ icon: 'folder', text: year.toString(10) }, items]
  })
  const tasksItems: Item[] = yearsTasks.flatMap((year) => {
    const yearEntries = yearEntriesTasks.get(year) ?? { months: [], monthEntries: new Map<number, Entry[]>() }
    const items: Item[] = yearEntries.months.flatMap((month) => {
      const items: TextItem[] = (yearEntries.monthEntries.get(month) ?? []).map((entry) => entryToItem(entry))
      items.sort((a, b) => b.text.localeCompare(a.text))
      return [{ icon: 'folder', text: month.toString(10) }, items]
    })

    return [{ icon: 'folder', text: year.toString(10) }, items]
  })

  const miscHoursItems = miscHours.map((entry) => entryToItem(entry))
  const miscTasksItems = miscTasks.map((entry) => entryToItem(entry))

  return {
    hoursEntries: [...hoursItems, { icon: 'folder', text: 'Misc' }, miscHoursItems] satisfies Item[],
    tasksEntries: [...tasksItems, { icon: 'folder', text: 'Misc' }, miscTasksItems] satisfies Item[],
  }
})
</script>
