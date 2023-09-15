// noinspection ES6UnusedImports
// @ts-ignore
import {Temporal, Intl, toTemporalInstant} from "@js-temporal/polyfill";

export interface WorkRange {
    from: string | null
    to: string | null
    notes?: string
}

export type WorkDays = { [day: string]: WorkRange[] }

export interface ComputedWorkEntries {
    day: string
    from: string
    to: string
    workedTime: string
    extraTime: string
    lostTime: string
    estimate: boolean
    subtractedTime: string
    notes: string
}

function toMinutes(str: string): number {
    return Temporal.PlainTime.from(str).since('00:00').total({unit: 'minutes'})
}

function fromMinutes(minutes: number): string {
    const dur = Temporal.Duration.from({minutes}).round({smallestUnit: "minutes", largestUnit: 'days'})

    const days = dur.days
    const hours = dur.hours
    const balancedMinutes = dur.minutes

    const hourMinutes = `${hours.toString().padStart(2, '0')}:${balancedMinutes.toString().padStart(2, '0')}`

    if (days > 0) return `${days} days, ${hourMinutes}`
    else return hourMinutes
}

export function computeWorkTime(workDays: WorkDays, leftoverTime: string, defaultFrom: string, defaultTo: string, workTime: string): ComputedWorkEntries[] {
    const workEntriesComputed: ComputedWorkEntries[] = []
    let timeDiff = toMinutes(leftoverTime)
    for (const [day, entries] of Object.entries(workDays)) {
        for (const [idx, entry] of entries.entries()) {
            const workedTime = toMinutes(entry.to ?? defaultTo) - toMinutes(entry.from ?? defaultFrom)
            timeDiff += workedTime

            const subtractedTime = idx === entries.length - 1 ? toMinutes(workTime) : 0;
            timeDiff -= subtractedTime

            workEntriesComputed.push({
                day,
                from: entry.from ?? defaultFrom,
                to: entry.to ?? defaultTo,
                workedTime: fromMinutes(workedTime),
                extraTime: fromMinutes(timeDiff > 0 ? timeDiff : 0),
                lostTime: fromMinutes(timeDiff < 0 ? Math.abs(timeDiff) : 0),
                estimate: entry.from === null || entry.to === null,
                subtractedTime: fromMinutes(subtractedTime),
                notes: entry.notes ?? '',
            })
        }
    }

    return workEntriesComputed
}
