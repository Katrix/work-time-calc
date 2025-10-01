import { Temporal } from '@js-temporal/polyfill'
import { type WorkRange } from '../types/calc'

export type WorkDays = { [group: string]: WorkRange[] }

export interface ComputedWorkEntry {
  name: string
  from: string | null
  to: string | null
  workedTime: string
  timeDiff: string
  extraTime: string
  estimate: boolean
  subtractedTime: string
  notes: string
  idx?: number
  tags: string[]
}

export function strToMinutesSafe(str: string): number | null | undefined {
  let sign = 1
  if (str.startsWith('-')) {
    str = str.substring(1)
    sign = -1
  }

  if (str.length === 0) {
    return null
  }

  if (!/^\d+:\d+$/.test(str)) {
    return undefined
  }

  const [hours, minutes] = str.split(':', 2)

  return sign * (Number(hours) * 60 + Number(minutes))
}

export function strToMinutes(str: string): number {
  const res = strToMinutesSafe(str)
  if (res === null || res === undefined) {
    throw new Error(`Invalid time string: ${str}`)
  }
  return res
}

export function strFromMinutes(minutes: number): string {
  let negative = false
  if (minutes < 0) {
    minutes = Math.abs(minutes)
    negative = true
  }

  const dur = Temporal.Duration.from({ minutes }).round({ smallestUnit: 'minutes', largestUnit: 'hours' })

  const hours = dur.hours
  const balancedMinutes = dur.minutes

  const res = `${hours.toString().padStart(2, '0')}:${balancedMinutes.toString().padStart(2, '0')}`
  return negative ? `-${res}` : res
}

export interface TagSummary {
  time: string
  names: string[]
  notes: string[]
}

export interface ComputedWorkTime {
  entries: ComputedWorkEntry[]
  summaryByTag: Record<string, TagSummary>
}

export function computeWorkTime(
  workDays: WorkDays,
  leftoverTime: number,
  defaultFrom: number,
  defaultTo: number,
  workTime: number,
): ComputedWorkTime {
  const workEntriesComputed: ComputedWorkEntry[] = []
  const tagSummaries: Record<string, TagSummary> = {}
  const tagTime: Record<string, number> = {}

  let timeDiff = leftoverTime
  for (const [, entries] of Object.entries(workDays)) {
    const preEntries = entries.map((entry, idx) => {
      const from = entry.from ?? defaultFrom
      const to = entry.to ?? defaultTo
      return {
        from,
        to,
        workedTime: to - from,
        subtracted:
          (entry.subtractedTime !== null ? entry.subtractedTime : null) ?? (idx === entries.length - 1 ? workTime : 0),
      }
    })
    for (let i = preEntries.length - 1; i >= 0; i--) {
      const preEntry = preEntries[i]
      for (let j = i - 1; j >= 0; j--) {
        const preEntry2 = preEntries[j]
        if (preEntry2.from <= preEntry.from && preEntry2.to >= preEntry.to) {
          preEntry2.workedTime -= preEntry.workedTime
        }
      }
    }

    for (const [idx, preEntry] of preEntries.entries()) {
      const entry = entries[idx]
      timeDiff += preEntry.workedTime
      timeDiff -= preEntry.subtracted

      for (const tag of entry.tags ?? []) {
        if (!tagSummaries[tag]) {
          tagSummaries[tag] = { time: '00:00', names: [], notes: [] }
        }
        if (!tagTime[tag]) {
          tagTime[tag] = 0
        }

        tagSummaries[tag].names.push(entry.name)
        if (entry.notes) {
          tagSummaries[tag].notes.push(entry.notes)
        }

        tagTime[tag] += preEntry.workedTime
      }

      workEntriesComputed.push({
        name: entry.name,
        from: strFromMinutes(preEntry.from),
        to: strFromMinutes(preEntry.to),
        workedTime: strFromMinutes(preEntry.workedTime),
        timeDiff: strFromMinutes(timeDiff),
        extraTime: (timeDiff < 0 ? '-' : '') + strFromMinutes(Math.abs(timeDiff)),
        estimate: entry.from === null || entry.to === null,
        subtractedTime: strFromMinutes(preEntry.subtracted),
        notes: entry.notes ?? '',
        idx: entry.idx,
        tags: entry.tags ?? [],
      })
    }
  }

  for (const [tag, time] of Object.entries(tagTime)) {
    tagSummaries[tag].time = strFromMinutes(time)
  }

  return { entries: workEntriesComputed, summaryByTag: tagSummaries }
}

function dateToMinutes(d: Date, precision: number) {
  if (!Number.isInteger(precision) || precision <= 0) {
    throw new Error(`Invalid precision: ${precision}`)
  }

  const hours = d.getHours()
  const minutes = d.getMinutes()

  const totalMinutes = hours * 60 + minutes

  const roundedTotalMinutes = Math.round(totalMinutes / precision) * precision
  const roundedHours = Math.floor(roundedTotalMinutes / 60)
  const roundedMinutes = roundedTotalMinutes - roundedHours * 60

  return roundedHours * 60 + roundedMinutes
}

function dateToTimeString(d: Date, precision: number) {
  return strFromMinutes(dateToMinutes(d, precision))
}

export function currentTime(precision: number) {
  return dateToMinutes(new Date(), precision)
}
