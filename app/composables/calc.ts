import equal from 'fast-deep-equal/es6'
import type { InternalApi } from 'nitropack/types'
import { Intl as TemporalIntl, Temporal } from '@js-temporal/polyfill'
import z from 'zod'
import type { FetchError } from 'ofetch'
import type { Reactive } from 'vue'
import { type QueryClient, useMutation, type UseMutationReturnType, useQueryClient } from '@tanstack/vue-query'
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'
import { debounceFilter } from '@vueuse/core'

export function computedCalc(calc: CalcWithEntries) {
  const now = useNow()
  const workDaysObj: WorkDays = {}
  if (calc.mode === 'tasks') {
    workDaysObj[calc.name] = calc.entries
  } else {
    for (const workDay of calc.entries) {
      if (workDay) {
        if (!workDaysObj[workDay.name]) {
          workDaysObj[workDay.name] = []
        }
        workDaysObj[workDay.name].push(workDay)
      }
    }
  }

  try {
    const res = computeWorkTime(
      workDaysObj,
      calc.savedUpTime,
      calc.defaultFrom,
      calc.defaultTo,
      calc.workTime,
      now.value,
      calc.precision,
    )
    res.entries.sort((a, b) => (a.rank < b.rank ? -1 : b.rank < a.rank ? 1 : 0))
    return res
  } catch (e) {
    // Ignored
    return null
  }
}

export function useComputedCalc(entry: Ref<CalcWithEntries>) {
  const now = useNow()
  const computedRef = ref<ComputedWorkTime>({ entries: [], summaryByTag: {} })

  function doCompute() {
    const res = computedCalc(entry.value)
    if (res) {
      computedRef.value = res
    }
  }

  const nowWithNowPrecision = computed(() => dateToMinutesRounded(now.value, entry.value.precision))

  watch(entry, doCompute, { immediate: true, deep: true })
  watch(nowWithNowPrecision, doCompute)

  return computedRef
}

function useLocalStoragePersister(id: Ref<string>, calc: Ref<CalcWithEntries>) {
  const serializedData = computed(() => encodeCalcToString(calc.value))
  watch(serializedData, (newV) => {
    localStorage.setItem(
      `calcs.${id.value}`,
      JSON.stringify({
        lastUpdated: Date.now(),
        data: newV,
      }),
    )
  })
}

function useServerPersister(id: Ref<string>, calc: Ref<CalcWithEntries>, queryClient: QueryClient) {
  const addRowMutation = useMutation(
    {
      async mutationFn(entry: CalcEntry) {
        return await $fetch<InternalApi['/api/calc/:id/entries']['post']>(`/api/calc/${id.value}/entries`, {
          body: entry,
          method: 'POST',
        })
      },
    },
    queryClient,
  )

  const updateRowMutation = useMutation(
    {
      async mutationFn(entry: CalcEntry) {
        return await $fetch<InternalApi['/api/calc/:id/entries/:rank']['post']>(
          `/api/calc/${id.value}/entries/${entry.rank}`,
          {
            body: entry,
            method: 'POST'
          },
        )
      },
    },
    queryClient,
  )

  const removeRowMutation = useMutation(
    {
      mutationFn(rank: string) {
        return $fetch<InternalApi['/api/calc/:id/entries/:rank']['delete']>(`/api/calc/${id.value}/entries/${rank}`, {
          method: 'DELETE',
        })
      },
    },
    queryClient,
  )

  const updateSettingsMutation = useMutation(
    {
      async mutationFn(calc: Calc) {
        return await $fetch<InternalApi['/api/calc/:id']['put']>(`/api/calc/${id}`, {
          body: calc,
          method: 'PUT'
        })
      },
    },
    queryClient,
  )

  const updateAllRowsMutation = useMutation(
    {
      async mutationFn(entries: CalcEntry[]) {
        return await $fetch<InternalApi['/api/calc/:id/entries']['put']>(`/api/calc/${id.value}/entries`, {
          body: entries,
          method: 'PUT'
        })
      },
    },
    queryClient,
  )

  const session = useUserSession()

  const { pause, resume } = watchWithFilter(
    calc,
    async (newV, oldV) => {
      if (!session.loggedIn.value) {
        return
      }

      pause()
      try {
        const newWithoutEntries = { ...newV, entries: [] }
        const oldWithoutEntries = { ...oldV, entries: [] }

        if (!equal(newWithoutEntries, oldWithoutEntries)) {
          await updateSettingsMutation.mutateAsync(newV)
        }

        const oldByRank = new Map(oldV.entries.map((entry) => [entry.rank, entry]))
        const newByRank = new Map(newV.entries.map((entry) => [entry.rank, entry]))

        const ranks = new Set([...oldByRank.keys(), ...newByRank.keys()])

        let updateAll = false
        let prospectiveAdds: CalcEntry[] = []
        let prospectiveUpdates: CalcEntry[] = []
        let prospectiveRemoves: string[] = []
        let prospectiveRequestCount = 0

        for (const rank of ranks) {
          const old = oldByRank.get(rank)
          const newEntry = newByRank.get(rank)

          if (!old) {
            if (!newEntry) {
              continue // Nonsense
            }

            prospectiveAdds.push(newEntry)
            prospectiveRequestCount += 1
          } else if (!newEntry) {
            prospectiveRemoves.push(rank)
            prospectiveRequestCount += 1
          } else if (!equal(old, newEntry)) {
            prospectiveUpdates.push(newEntry)
            prospectiveRequestCount += 1
          }

          if (prospectiveRequestCount > ranks.size / 4) {
            updateAll = true
            break
          }
        }

        if (updateAll) {
          await updateAllRowsMutation.mutateAsync(newV.entries)
        } else {
          for (const entry of prospectiveAdds) {
            await addRowMutation.mutateAsync(entry)
          }
          for (const entry of prospectiveUpdates) {
            await updateRowMutation.mutateAsync(entry)
          }
          for (const rank of prospectiveRemoves) {
            await removeRowMutation.mutateAsync(rank)
          }
        }
      } finally {
        resume()
      }
    },
    {
      eventFilter: debounceFilter(2000),
    },
  )
}

function useCalcPersister(
  id: Ref<string>,
  entry: Ref<CalcWithEntries>,
  lastUpdated: Ref<number>,
  queryClient: QueryClient,
) {
  watch(entry, () => {
    lastUpdated.value = Date.now()
  })

  if (import.meta.client) {
    useLocalStoragePersister(id, entry)
    useServerPersister(id, entry, queryClient)
  }
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

function defaultEntryName(mode: 'hours' | 'tasks'): string {
  if (mode === 'hours') {
    return Temporal.Now.plainDateISO(Temporal.Now.timeZoneId()).toJSON()
  } else {
    return ''
  }
}

export function makeNewCalc(mode: 'hours' | 'tasks', preset: Preset): CalcWithEntries {
  const defaultVal = preset[mode]

  return {
    version: currentCalcVersion,
    name: nameDefault(mode),
    mode: mode,
    savedUpTime: 0,
    savedUpVacation: 0,
    workTime: defaultVal.workTime,
    defaultFrom: defaultVal.defaultFrom,
    defaultTo: defaultVal.defaultTo,
    precision: defaultVal.precision,
    tags: new Map([...defaultVal.tags.entries()]),
    entries: [
      {
        name: defaultEntryName(mode),
        from: defaultVal.defaultFrom,
        to: null,
        subtractedTime: null,
        rank: generateKeyBetween(null, null),
      },
    ],
  }
}

export interface CalcInfo {
  id: string
  calc: CalcWithEntries
  requestError: FetchError | undefined
  lastUpdated: number
  computedCalc: ComputedWorkTime

  switchMode(): void
  fillWorkdays(): void
  fillRemainingWorkdays(): void
  clear(): void
  loadFromFile(file: File): Promise<void>

  addRowAfter(idx: number): void
  removeRow(idx: number): void

  addTag(index: number, tag: string): void
  deleteTag(tagName: string, { deleteConfigured }: { deleteConfigured: boolean }): void
  removeTag(index: number, tag: string): void
  getTagColor(tag: string): string
}

export async function useCalcsInfo(id: Ref<string>): Promise<Reactive<CalcInfo>> {
  const presetStore = usePresetStore()
  const scope = effectScope()

  function loadCalcFromLocalStorage(id: string, serverLastUpdated: number) {
    if (import.meta.client) {
      const calcWrapperStr = localStorage.getItem(`calcs.${id}`)
      if (!calcWrapperStr) {
        return null
      }

      const lastUpdatedSchema = z.object({
        lastUpdated: z.number(),
        data: z.string(),
      })

      const data = lastUpdatedSchema.parse(JSON.parse(calcWrapperStr))

      if (data.lastUpdated > serverLastUpdated) {
        const calcFromStorage = decodeCalcFromString(data.data)
        return { lastUpdated: data.lastUpdated, data: calcFromStorage }
      }
    }

    return null
  }

  const session = useUserSession()

  async function loadCalc(id: Ref<string>) {
    // UseFetch instead of UseQuery, as useFetch gives us a mutable writeable ref
    const { data, error, refresh } = await useFetch<InternalApi['/api/calc/:id']['get']>(
      () => `/api/calc/${id.value}`,
      {
        deep: true,
        immediate: session.loggedIn.value,
      },
    )

    return scope.run(() => {
      watch(session.loggedIn, () => {
        if (session.loggedIn.value) {
          refresh()
        }
      })

      const localStorage = computed(() =>
        loadCalcFromLocalStorage(id.value, data.value ? new Date(data.value.updatedAt).getTime() : 0),
      )
      const lastUpdated = computed(() => {
        const local = localStorage.value
        if (local) {
          return local.lastUpdated
        }

        if (data.value) {
          return new Date(data.value.updatedAt).getTime()
        }

        return 0
      })

      const calc = ref<CalcWithEntries>(makeNewCalc('hours', presetStore.currentPreset))
      watchEffect(() => {
        const local = localStorage.value
        if (local) {
          calc.value = local.data
        } else if (data.value) {
          calc.value = calcWithEntriesV2Schema.parse(data.value)
        } else {
          calc.value = makeNewCalc('hours', presetStore.currentPreset)
        }
      })

      return { calc, error, lastUpdated }
    })!
  }

  const queryClient = useQueryClient()
  const toast = useToast()

  const { calc, lastUpdated, error } = await loadCalc(id)

  watch(error, (v) => {
    if (v) {
      toast.create({ body: v.message, variant: 'danger' })
    }
  })

  function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16)
  }

  function setSettingsToDefaults() {
    const defaultVals = presetStore.currentPreset[calc.value.mode]
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

  function fillWorkdaysBase(start: Temporal.PlainDate) {
    const holidayRules = presetStore.currentPreset.holidayRules

    const monthDates: Temporal.PlainDate[] = []
    let date = start
    let i = 0
    while (date.month === start.month) {
      monthDates.push(date)
      date = date.add({ days: 1 })
      i += 1
      if (i > 31) {
        throw new Error(`Did not stop when expected ${date}`)
      }
    }

    return monthDates.filter((d) => !isHoliday(d, holidayRules))
  }

  return scope.run(() => {
    useCalcPersister(id, calc, lastUpdated, queryClient)

    return reactive({
      id,
      calc,
      requestError: error,
      lastUpdated,
      computedCalc: useComputedCalc(calc),
      switchMode() {
        if (calc.value.mode === 'hours') {
          setMode('tasks')
        } else {
          setMode('hours')
        }
      },
      async loadFromFile(file: File) {
        calc.value = {
          ...calc.value,
          ...decodeCalcFromString(await file.text()),
        }
      },
      getTagColor(tag: string) {
        const existing = calc.value.tags.get(tag)
        if (existing) {
          return existing
        }

        const color = randomColor()
        calc.value.tags.set(tag, color)
        return color
      },
      addRowAfter(idx: number) {
        const before = calc.value.entries[idx]?.rank
        const after = calc.value.entries[idx + 1]?.rank
        const rank = generateKeyBetween(before, after)

        calc.value.entries.splice(idx + 1, 0, {
          name: defaultEntryName(calc.value.mode),
          from: calc.value.defaultFrom,
          to: null,
          subtractedTime: null,
          rank,
        })
      },
      removeRow(idx: number) {
        calc.value.entries.splice(idx, 1)
      },
      clear() {
        calc.value.entries = [
          {
            name: defaultEntryName(calc.value.mode),
            from: calc.value.defaultFrom,
            to: calc.value.defaultTo,
            subtractedTime: null,
            rank: generateKeyBetween(null, null),
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
      deleteTag(tagName: string, { deleteConfigured }: { deleteConfigured: boolean }) {
        const tag = calc.value.tags.get(tagName)
        if (tag && presetStore.currentPreset[calc.value.mode].tags.has(tagName) && !deleteConfigured) {
          return
        }
        calc.value.tags.delete(tagName)
      },
      removeTag(index: number, tag: string) {
        const entry = calc.value.entries[index]
        entry?.tags?.splice(entry.tags?.indexOf(tag), 1)

        if (calc.value.entries.every((e) => !e.tags?.includes(tag))) {
          this.deleteTag(tag, { deleteConfigured: false })
        }
      },
      fillWorkdays() {
        const dates = fillWorkdaysBase(Temporal.PlainDate.from(calc.value.entries[0].name))
        const ranks = generateNKeysBetween(null, null, dates.length)
        calc.value.entries = dates.map((d, i) => ({
          name: d.toString(),
          from: null,
          to: null,
          subtractedTime: null,
          rank: ranks[i],
        }))
      },
      fillRemainingWorkdays() {
        const start = Temporal.PlainDate.from(calc.value.entries[calc.value.entries.length - 1].name).add({ days: 1 })
        const startRank = calc.value.entries.at(-1)?.rank
        const dates = fillWorkdaysBase(start)
        const ranks = generateNKeysBetween(startRank, null, dates.length)
        calc.value.entries.push(
          ...dates.map((d, i) => ({
            name: d.toString(),
            from: null,
            to: null,
            subtractedTime: null,
            rank: ranks[i],
          })),
        )
      },
    } satisfies Omit<CalcInfo, 'calc' | 'computedCalc' | 'requestError' | 'lastUpdated' | 'id'> & {
      id: Ref<string>
      calc: Ref<CalcWithEntries>
      computedCalc: Ref<ComputedWorkTime>
      requestError: Ref<FetchError | undefined>
      lastUpdated: Ref<number>
    })
  })!
}
