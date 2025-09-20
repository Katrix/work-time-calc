import { Intl as TemporalIntl, Temporal } from '@js-temporal/polyfill'
import Holidays from 'date-holidays'
import type { WatchHandle } from 'vue'
import * as devalue from 'devalue'
import { skipHydrate } from 'pinia'

export interface Calc {
  name: string
  mode: 'hours' | 'tasks'
  savedUpTime: string
  savedUpVacation: string
  workTime: string
  defaultFrom: string
  defaultTo: string
  precision: number
  tags: Map<string, { color: string; fromPreset?: boolean }>

  entries: (WorkRange & { customSubtractedTime: boolean; isTracking?: boolean })[]
}

export const useCalcStore = defineStore('calcs', () => {
  const presetStore = usePresetStore()

  function defaults(mode: 'hours' | 'tasks') {
    return presetStore.currentPreset[mode]
  }

  function nameDefault(mode: 'hours' | 'tasks') {
    const now = Temporal.Now.plainDateISO()
    if (mode === 'hours') {
      const monthName = new TemporalIntl.DateTimeFormat('en', { month: 'long' }).format(now)
      return `${now.year}-${now.month}-${monthName}`
    } else {
      return now.toString()
    }
  }

  function makeNewCalc(mode: 'hours' | 'tasks'): Calc {
    const defaultVal = defaults(mode)

    return {
      name: nameDefault(mode),
      mode: mode,
      savedUpTime: '00:00',
      savedUpVacation: '0',
      workTime: defaultVal.workTime,
      defaultFrom: defaultVal.defaultFrom,
      defaultTo: defaultVal.defaultTo,
      precision: defaultVal.precision,
      tags: new Map([...defaultVal.tags.entries()].map(([k, color]) => [k, { color, fromPreset: true }])),
      entries: [
        {
          day: defaultEntryName(mode),
          from: defaultVal.defaultFrom,
          to: null,
          subtractedTime: null,
          customSubtractedTime: false,
        },
      ],
    }
  }

  function watcherForCalc(id: string, defaultCalc: Calc, entry: Ref<Calc>) {
    const defaultStr = devalue.stringify(defaultCalc)
    return watch(
      entry,
      () => {
        lastUpdated.value.set(id, Date.now())

        if (import.meta.client) {
          const serializedData = devalue.stringify(entry.value)

          if (serializedData !== defaultStr) {
            localStorage.setItem(
              `calcs.${id}`,
              JSON.stringify({
                lastUpdated: Date.now(),
                data: devalue.stringify(entry.value),
              }),
            )
          }
        }
      },
      {
        deep: true,
      },
    )
  }

  function makeComputedTime(entry: Ref<Calc>) {
    return computed<ComputedWorkTime>((oldValue) => {
      const calc = entry.value

      const workDaysObj: WorkDays = {}
      if (calc.mode === 'tasks') {
        const group = []
        for (const [idx, workDay] of calc.entries.entries()) {
          if (workDay) {
            group.push({
              ...workDay,
              idx,
            })
          }
        }

        workDaysObj[calc.name] = group
      } else {
        for (const [idx, workDay] of calc.entries.entries()) {
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
      }

      try {
        const res = computeWorkTime(workDaysObj, calc.savedUpTime, calc.defaultFrom, calc.defaultTo, calc.workTime)
        res.entries.sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))
        return res
      } catch (e) {
        // Ignored
        return oldValue ?? { entries: [], summaryByTag: {} }
      }
    })
  }

  function newCalcWithWatchers(id: string, mode: 'hours' | 'tasks') {
    const defaultCalc = makeNewCalc(mode)
    const entry = ref(defaultCalc)

    const watcher = watcherForCalc(id, defaultCalc, entry)
    const computedTime = makeComputedTime(entry)

    // Wrap the watcher in a ref so that it can be skipped during hydration
    return { entry, computedTime: skipHydrate(computedTime), watcher: skipHydrate(ref(watcher)) }
  }

  function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16)
  }

  function dateToDateString(d: Date) {
    try {
      const isoStr = d.toISOString()
      return isoStr.substring(0, isoStr.search('T'))
    } catch (e) {
      return null
    }
  }

  function defaultEntryName(mode: 'hours' | 'tasks'): string {
    if (mode === 'hours') {
      return dateToDateString(new Date()) ?? ''
    } else {
      return ''
    }
  }

  const lastUpdated = ref(new Map<string, number>())

  const saveFiles = ref(new Map<string, File>())

  const calcs = shallowRef<
    Map<string, { entry: Ref<Calc>; computedTime: Ref<ComputedWorkTime>; watcher: Ref<WatchHandle> }>
  >(
    (() => {
      const route = useRoute()
      const id = route.name === 'calculation' ? route.params.calculation : crypto.randomUUID()
      return new Map([[id, newCalcWithWatchers(id, 'hours')]])
    })(),
  )

  if (import.meta.client) {
    watch(calcs, () => {
      localStorage.setItem('calcs', JSON.stringify([...calcs.value.keys()]))
    })
  }

  function calcName(calcId: string, idx: number) {
    const calc = calcs.value.get(calcId)?.entry?.value
    return calc?.name?.length ? calc?.name : `Calc${idx + 1}`
  }

  const useCalc = (id: Ref<string>) => {
    const calc = computed<Calc, Calc>({
      get: () => {
        const existing = calcs.value.get(id.value)?.entry?.value
        if (existing) {
          return existing
        }

        throw new Error(`Calc ${id.value} not found`)
      },
      set: (value) => {
        const c = calcs.value.get(id.value)
        if (c) {
          c.entry.value = value
        }
      },
    })

    const computedCalc = computed(() => calcs.value.get(id.value)?.computedTime?.value ?? null)

    function setSettingsToDefaults() {
      const defaultVals = defaults(calc.value.mode)
      calc.value.workTime = defaultVals.workTime
      calc.value.defaultFrom = defaultVals.defaultFrom
      calc.value.defaultTo = defaultVals.defaultTo
      calc.value.precision = defaultVals.precision
    }

    function setMode(mode: 'hours' | 'tasks') {
      const oldNameDefault = nameDefault(calc.value.mode)

      calc.value.mode = mode
      setSettingsToDefaults()
      if (calc.value.name === oldNameDefault) {
        calc.value.name = nameDefault(mode)
      }
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

    return {
      calc,
      computedCalc,
      calcName(idx: number) {
        return calcName(id.value, idx)
      },
      switchMode() {
        if (calc.value.mode === 'hours') {
          setMode('tasks')
        } else {
          setMode('hours')
        }
      },
      loadData(
        data: {
          mode: 'hours' | 'tasks'
          name: string
          savedUpTime: string
          savedUpVacation: string
          workTime: string
          defaultFrom: string
          defaultTo: string
        },
        newEntries: (WorkRange & { customSubtractedTime: boolean; isTracking?: boolean })[],
      ) {
        calc.value = {
          ...calc.value,
          mode: data.mode,
          name: data.name,
          savedUpTime: data.savedUpTime,
          savedUpVacation: data.savedUpVacation,
          workTime: data.workTime,
          defaultFrom: data.defaultFrom,
          defaultTo: data.defaultTo,
          entries: newEntries,
        }
      },
      getTagColor(tag: string) {
        const existing = calc.value.tags.get(tag)
        if (existing) {
          return existing.color
        }

        const color = randomColor()
        calc.value.tags.set(tag, { color })
        return color
      },
      deleteTag(tagName: string, { deleteConfigured }: { deleteConfigured: boolean }) {
        const tag = calc.value.tags.get(tagName)
        if (tag && tag.fromPreset && !deleteConfigured) {
          return
        }
        calc.value.tags.delete(tagName)
      },
      addRowAfter(idx: number) {
        const name = defaultEntryName(calc.value.mode)

        calc.value.entries.splice(idx + 1, 0, {
          day: name,
          from: calc.value.defaultFrom ?? null,
          to: null,
          subtractedTime: null,
          customSubtractedTime: false,
        })
      },
      removeRow(idx: number) {
        calc.value.entries.splice(idx, 1)
      },
      clear() {
        calc.value.entries = [
          {
            day: defaultEntryName(calc.value.mode),
            from: calc.value.defaultFrom ?? null,
            to: calc.value.defaultTo ?? null,
            subtractedTime: null,
            customSubtractedTime: false,
          },
        ]
      },
      addTag(index: number, tag: string) {
        const entry = calc.value.entries[index]
        if (entry) {
          entry.tags ??= []
          entry.tags.push(tag)
        }
      },
      removeTag(index: number, tag: string) {
        const entry = calc.value.entries[index]
        entry?.tags?.splice(entry.tags?.indexOf(tag), 1)

        if (calc.value.entries.every((e) => !e.tags?.includes(tag))) {
          this.deleteTag(tag, { deleteConfigured: false })
        }
      },
      fillWorkdays() {
        const dates = fillWorkdaysBase(new Date(calc.value.entries[0].day))
        calc.value.entries = dates.map((d) => ({
          day: dateToDateString(d) ?? '',
          from: null,
          to: null,
          subtractedTime: null,
          customSubtractedTime: false,
        }))
      },
      fillRemainingWorkdays() {
        const start = new Date(calc.value.entries[calc.value.entries.length - 1].day)
        start.setDate(start.getDate() + 1)
        const dates = fillWorkdaysBase(start)
        calc.value.entries.push(
          ...dates.map((d) => ({
            day: dateToDateString(d) ?? '',
            from: null,
            to: null,
            subtractedTime: null,
            customSubtractedTime: false,
          })),
        )
      },
    }
  }

  function addCalc(newId?: string) {
    newId ??= crypto.randomUUID()
    calcs.value.set(newId, newCalcWithWatchers(newId, 'hours'))
    triggerRef(calcs)
    navigateTo({ name: 'calculation', params: { calculation: newId } })
  }

  function removeCalc(id: string) {
    if (calcs.value.size === 1) {
      return
    }

    const route = useRoute()
    const needNavigation = route.name === 'calculation' && route.params.calculation === id
    const idx = [...calcs.value.keys()].reduce<number | null>(
      (acc, key, idx) => (acc !== null ? acc : key === id ? idx : null),
      null,
    )

    const removed = calcs.value.get(id)

    calcs.value.delete(id)

    if (removed) {
      removed.watcher.value.stop()
    }

    triggerRef(calcs)

    if (import.meta.client) {
      localStorage.removeItem(`calcs.${id}`)
    }

    if (needNavigation) {
      const newIdx = idx !== null ? Math.min(idx + 1, calcs.value.size - 1) : null
      const nextCalc = newIdx !== null ? [...calcs.value.keys()].find((k, idx) => idx === newIdx) : null
      navigateTo({
        name: 'calculation',
        params: { calculation: nextCalc ?? firstCalc() },
      })
    }
  }

  function firstCalc() {
    return calcs.value.keys().next().value!
  }

  if (import.meta.client) {
    nextTick(() => {
      // Hydration can mess up our watchers, so first we need to re-add them
      for (const [id, calc] of calcs.value) {
        calc.watcher = skipHydrate(ref(watcherForCalc(id, makeNewCalc('hours'), calc.entry)))
        calc.computedTime = makeComputedTime(calc.entry)
      }

      const calcsStr = localStorage.getItem('calcs')
      if (calcsStr) {
        const calcsArr = JSON.parse(calcsStr) as string[]
        for (let calcId of calcsArr) {
          if (!calcs.value.has(calcId)) {
            calcs.value.set(calcId, newCalcWithWatchers(calcId, 'hours'))
          }
        }
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key || !key.startsWith('calcs.')) {
          continue
        }

        const id = key.substring('calcs.'.length)

        const dataStr = localStorage.getItem(key)
        if (!dataStr) {
          continue
        }

        const data = JSON.parse(dataStr) as { lastUpdated: number; data: string }

        if (data.lastUpdated > (lastUpdated.value.get(id) ?? 0)) {
          const calcFromStorage = devalue.parse(data.data) as Calc
          lastUpdated.value.set(id, data.lastUpdated)

          let calcRef = calcs.value.get(id)
          if (!calcRef) {
            calcRef = newCalcWithWatchers(id, 'hours')
            calcs.value.set(id, calcRef)
          }

          calcRef.entry.value = calcFromStorage
        }
      }

      triggerRef(calcs)
    })
  }

  return {
    calcs,
    saveFiles: skipHydrate(saveFiles),
    lastUpdated,
    addCalc,
    removeCalc,
    calcName,
    useCalc,
    firstCalc,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCalcStore, import.meta.hot))
}
