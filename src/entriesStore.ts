import { defineStore } from 'pinia'
import { ref, watchSyncEffect } from 'vue'
import Holidays from 'date-holidays'
import { type ComputedWorkEntries, computeWorkTime, type WorkDays, type WorkRange } from '@/ComputeWorkTime.ts'
import { useSettingsStore } from '@/settingsStore.ts'

export const useEntriesStore = (storeId: string) => {
  const store = defineStore(`entries-${storeId}`, () => {
    const settingsStore = useSettingsStore(storeId)

    function dateToDateString(d: Date) {
      try {
        const isoStr = d.toISOString()
        return isoStr.substring(0, isoStr.search('T'))
      } catch (e) {
        return null
      }
    }

    function defaultEntryName(): string {
      if (settingsStore.mode === 'hours') {
        return dateToDateString(new Date()) ?? ''
      } else {
        return ''
      }
    }

    const entries = ref<(WorkRange & { customSubtractedTime: boolean; isTracking?: boolean })[]>([
      { day: defaultEntryName(), from: null, to: null, subtractedTime: null, customSubtractedTime: false },
    ])
    const computedWorkDays = ref<ComputedWorkEntries[]>([])

    watchSyncEffect(() => {
      const workDaysObj: WorkDays = {}
      if (settingsStore.mode === 'tasks') {
        const group = []
        for (const [idx, workDay] of entries.value.entries()) {
          if (workDay) {
            group.push({
              ...workDay,
              idx,
            })
          }
        }

        workDaysObj[settingsStore.nameInput] = group
      } else {
        for (const [idx, workDay] of entries.value.entries()) {
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
        computedWorkDays.value = computeWorkTime(
          workDaysObj,
          settingsStore.savedUpTime,
          settingsStore.defaultFrom,
          settingsStore.defaultTo,
          settingsStore.workTime,
        ).sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))
      } catch (e) {
        // Ignored
      }
    })

    function setEntries(newEntries: (WorkRange & { customSubtractedTime: boolean; isTracking?: boolean })[]) {
      entries.value = newEntries
    }

    function addRowAfter(idx: number) {
      const name = defaultEntryName()

      entries.value.splice(idx + 1, 0, {
        day: name,
        from: settingsStore.defaultFrom,
        to: null,
        subtractedTime: null,
        customSubtractedTime: false,
      })
    }

    function removeRow(idx: number) {
      entries.value.splice(idx, 1)
    }

    function clear() {
      entries.value = [
        {
          day: defaultEntryName(),
          from: settingsStore.defaultFrom,
          to: settingsStore.defaultTo,
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
      const dates = fillWorkdaysBase(new Date(entries.value[0].day))
      entries.value = dates.map((d) => ({
        day: dateToDateString(d) ?? '',
        from: null,
        to: null,
        subtractedTime: null,
        customSubtractedTime: false,
      }))
    }

    function fillRemainingWorkdays() {
      const start = new Date(entries.value[entries.value.length - 1].day)
      start.setDate(start.getDate() + 1)
      const dates = fillWorkdaysBase(start)
      entries.value.push(
        ...dates.map((d) => ({
          day: dateToDateString(d) ?? '',
          from: null,
          to: null,
          subtractedTime: null,
          customSubtractedTime: false,
        })),
      )
    }

    return {
      entries,
      computedWorkDays,
      setEntries,
      addRowAfter,
      removeRow,
      clear,
      fillWorkdays,
      fillRemainingWorkdays,
    }
  })
  return store()
}
