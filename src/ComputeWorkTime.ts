// @ts-ignore
// noinspection ES6UnusedImports
import { Intl, Temporal, toTemporalInstant } from '@js-temporal/polyfill'

export interface WorkRange {
  from: string | null
  to: string | null
  subtractedTime: string | null
  notes?: string
  idx?: number
}

export type WorkDays = { [day: string]: WorkRange[] }

export interface ComputedWorkEntries {
  day: string
  from: string | null
  to: string | null
  workedTime: string
  timeDiff: string
  extraTime: string
  lostTime: string
  estimate: boolean
  subtractedTime: string
  notes: string
  idx?: number
}

function toMinutes(str: string): number {
  let sign = 1
  if (str.startsWith('-')) {
    str = str.substring(1)
    sign = -1
  }

  const [hours, minutes] = str.split(':', 2)

  return sign * Temporal.Duration.from({ hours: Number(hours), minutes: Number(minutes) }).total({ unit: 'minutes' })
}

function fromMinutes(minutes: number): string {
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

export function computeWorkTime(
  workDays: WorkDays,
  leftoverTime: string,
  defaultFrom: string,
  defaultTo: string,
  workTime: string,
): ComputedWorkEntries[] {
  const workEntriesComputed: ComputedWorkEntries[] = []
  let timeDiff = toMinutes(leftoverTime)
  for (const [day, entries] of Object.entries(workDays)) {
    for (const [idx, entry] of entries.entries()) {
      const workedTime = toMinutes(entry.to ?? defaultTo) - toMinutes(entry.from ?? defaultFrom)
      timeDiff += workedTime

      const subtractedTime =
        (entry.subtractedTime ? toMinutes(entry.subtractedTime) : null) ?? idx === entries.length - 1
          ? toMinutes(workTime)
          : 0
      timeDiff -= subtractedTime

      workEntriesComputed.push({
        day,
        from: entry.from,
        to: entry.to,
        workedTime: fromMinutes(workedTime),
        timeDiff: fromMinutes(timeDiff),
        extraTime: fromMinutes(timeDiff > 0 ? timeDiff : 0),
        lostTime: fromMinutes(timeDiff < 0 ? Math.abs(timeDiff) : 0),
        estimate: entry.from === null || entry.to === null,
        subtractedTime: fromMinutes(subtractedTime),
        notes: entry.notes ?? '',
        idx: entry.idx
      })
    }
  }

  return workEntriesComputed
}

function dateToTimeString(d: Date, precision: number) {
  const hours = d.getHours()
  const minutes = d.getMinutes()

  const totalMinutes = hours * 60 + minutes

  const roundedTotalMinutes = Math.round(totalMinutes / precision) * precision
  const roundedHours = Math.floor(roundedTotalMinutes / 60)
  const roundedMinutes = roundedTotalMinutes - roundedHours * 60

  const roundedHoursStr = roundedHours.toString(10).padStart(2, '0')
  const roundedMinutesStr = roundedMinutes.toString(10).padStart(2, '0')

  return `${roundedHoursStr}:${roundedMinutesStr}`
}

export function currentTime(precision: number) {
  return dateToTimeString(new Date(), precision)
}
