// @ts-ignore
// noinspection ES6UnusedImports
import {Intl, Temporal, toTemporalInstant} from "@js-temporal/polyfill";

export interface WorkRange {
    from: string | null
    to: string | null
    notes?: string
}

export type WorkDays = { [day: string]: WorkRange[] }

export interface ComputedWorkEntries {
    day: string
    from: string | null
    to: string | null
    workedTime: string
    extraTime: string
    lostTime: string
    estimate: boolean
    subtractedTime: string
    notes: string
}

function toMinutes(str: string): number {
    const [hours, minutes] = str.split(':', 2)

    return Temporal.Duration.from({hours: Number(hours), minutes: Number(minutes)}).total({unit: 'minutes'})
}

function fromMinutes(minutes: number): string {
    const dur = Temporal.Duration.from({minutes}).round({smallestUnit: "minutes", largestUnit: 'hours'})

    const hours = dur.hours
    const balancedMinutes = dur.minutes

    return `${hours.toString().padStart(2, '0')}:${balancedMinutes.toString().padStart(2, '0')}`
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
                from: entry.from,
                to: entry.to,
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
