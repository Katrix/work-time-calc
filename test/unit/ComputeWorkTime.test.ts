import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  strToMinutesSafe,
  strToMinutes,
  strFromMinutes,
  computeWorkTime,
  currentTime,
  type WorkDays,
} from '../../shared/utils/ComputeWorkTime'

const m = (hhmm: string) => strToMinutes(hhmm)

describe('strToMinutesSafe', () => {
  it('returns 0 for 00:00', () => {
    expect(strToMinutesSafe('00:00')).toBe(0)
  })

  it('parses positive and negative times', () => {
    expect(strToMinutesSafe('01:30')).toBe(90)
    expect(strToMinutesSafe('-02:15')).toBe(-135)
  })

  it('returns null for empty string and undefined for invalid format', () => {
    expect(strToMinutesSafe('')).toBeNull()
    expect(strToMinutesSafe('abc')).toBeUndefined()
    expect(strToMinutesSafe('12')).toBeUndefined()
  })

  it('does not validate minute overflow (e.g. 12:60 -> 13:00 equivalent)', () => {
    expect(strToMinutesSafe('12:60')).toBe(780)
  })

  it('accepts leading zeros in hours and minutes', () => {
    expect(strToMinutesSafe('000:05')).toBe(5)
    expect(strToMinutesSafe('01:005')).toBe(65)
  })

  it('rejects whitespace around the value', () => {
    expect(strToMinutesSafe(' 01:00')).toBeUndefined()
    expect(strToMinutesSafe('01:00 ')).toBeUndefined()
  })

  it('rejects plus sign prefix', () => {
    expect(strToMinutesSafe('+01:00')).toBeUndefined()
  })
})

describe('strToMinutes', () => {
  it('parses valid times and throws on invalid', () => {
    expect(strToMinutes('00:00')).toBe(0)
    expect(strToMinutes('-00:30')).toBe(-30)
    expect(() => strToMinutes('')).toThrowError()
    expect(() => strToMinutes('nope')).toThrowError()
  })

  it('throws on whitespace-padded values', () => {
    expect(() => strToMinutes(' 01:00')).toThrow()
    expect(() => strToMinutes('01:00 ')).toThrow()
  })

  it('throws on plus-prefixed values', () => {
    expect(() => strToMinutes('+01:00')).toThrow()
  })
})

describe('strFromMinutes', () => {
  it('formats minutes to HH:MM with sign and rollover', () => {
    expect(strFromMinutes(0)).toBe('00:00')
    expect(strFromMinutes(90)).toBe('01:30')
    expect(strFromMinutes(125)).toBe('02:05')
    expect(strFromMinutes(780)).toBe('13:00')
    expect(strFromMinutes(-5)).toBe('-00:05')
  })
})

describe('computeWorkTime', () => {
  it('single full-day entry subtracts default workTime on last entry', () => {
    const workDays: WorkDays = {
      Mon: [{ name: 'Work', from: m('09:00'), to: m('17:00'), subtractedTime: null }],
    }

    const res = computeWorkTime(workDays, 0, m('09:00'), m('17:00'), m('08:00'), new Date(), 1)

    expect(res.entries).toHaveLength(1)
    const e = res.entries[0]
    expect(e.from).toBe('09:00')
    expect(e.to).toBe('17:00')
    expect(e.workedTime).toBe('08:00')
    expect(e.timeDiff).toBe('00:00')
    expect(e.extraTime).toBe('00:00')
    expect(e.estimate).toBe(false)
    expect(e.subtractedTime).toBe('08:00')
  })

  it('uses defaults when from/to are null and sets estimate=true', () => {
    const workDays: WorkDays = {
      entry: [{ name: 'Defaulted', from: null, to: null, subtractedTime: null }],
    }

    const res = computeWorkTime(workDays, 0, m('09:00'), m('17:00'), m('08:00'), new Date(), 1)

    expect(res.entries[0].from).toBe('09:00')
    expect(res.entries[0].to).toBe('17:00')
    expect(res.entries[0].estimate).toBe(true)
  })

  it('accounts for nested/overlapping ranges', () => {
    const workDays: WorkDays = {
      entry: [
        { name: 'A', from: m('09:00'), to: m('17:00'), subtractedTime: null },
        { name: 'B', from: m('10:00'), to: m('11:00'), subtractedTime: null },
      ],
    }

    const res = computeWorkTime(workDays, 0, m('09:00'), m('17:00'), m('08:00'), new Date(), 1)

    expect(res.entries.map((e) => e.workedTime)).toEqual(['07:00', '01:00'])
    expect(res.entries[1].timeDiff).toBe('00:00')
  })

  it('respects custom subtractedTime = 0 (no default subtraction)', () => {
    const workDays: WorkDays = {
      entry: [{ name: 'Short', from: m('09:00'), to: m('10:00'), subtractedTime: 0 }],
    }

    const res = computeWorkTime(workDays, 0, m('09:00'), m('17:00'), m('08:00'), new Date(), 1)

    expect(res.entries[0].workedTime).toBe('01:00')
    expect(res.entries[0].subtractedTime).toBe('00:00')
    expect(res.entries[0].timeDiff).toBe('01:00')
    expect(res.entries[0].extraTime).toBe('01:00')
  })

  it('respects custom subtractedTime != 0 (custom subtraction)', () => {
    const workDays: WorkDays = {
      Fri: [{ name: 'One hour', from: m('09:00'), to: m('17:00'), subtractedTime: m('04:00') }],
    }

    const res = computeWorkTime(workDays, 0, m('09:00'), m('17:00'), m('08:00'), new Date(), 1)

    expect(res.entries[0].workedTime).toBe('08:00')
    expect(res.entries[0].timeDiff).toBe('04:00')
    expect(res.entries[0].extraTime).toBe('04:00')
  })

  it('builds tag summaries with aggregated time and names', () => {
    const workDays: WorkDays = {
      entry: [
        { name: 'Task A', from: m('09:00'), to: m('10:00'), subtractedTime: 0, tags: ['projA'] },
        { name: 'Task B', from: m('10:00'), to: m('11:00'), subtractedTime: 0, tags: ['projA', 'projB'] },
      ],
    }

    const res = computeWorkTime(workDays, 0, m('09:00'), m('17:00'), m('08:00'), new Date(), 1)

    expect(res.summaryByTag['projA'].time).toBe('02:00')
    expect(res.summaryByTag['projA'].names).toEqual(['Task A', 'Task B'])
    expect(res.summaryByTag['projB'].time).toBe('01:00')
    expect(res.summaryByTag['projB'].names).toEqual(['Task B'])
  })

  it('produces negative extraTime when overall timeDiff is negative', () => {
    const workDays: WorkDays = {
      Fri: [{ name: 'One hour', from: m('09:00'), to: m('10:00'), subtractedTime: m('02:00') }],
    }

    const res = computeWorkTime(workDays, 0, m('09:00'), m('17:00'), m('08:00'), new Date(), 1)

    expect(res.entries[0].workedTime).toBe('01:00')
    expect(res.entries[0].timeDiff).toBe('-01:00')
    expect(res.entries[0].extraTime).toBe('-01:00')
  })

  it('subtracts workTime only to the last entry within each group', () => {
    const workDays: WorkDays = {
      group: [
        { name: 'First', from: m('09:00'), to: m('10:00'), subtractedTime: null },
        { name: 'Second', from: m('10:00'), to: m('12:00'), subtractedTime: null },
      ],
    }

    const res = computeWorkTime(workDays, 0, m('09:00'), m('17:00'), m('08:00'), new Date(), 1)

    expect(res.entries[0].subtractedTime).toBe('00:00')
    expect(res.entries[1].subtractedTime).toBe('08:00')
  })

  it('handles multiple groups independently for last-entry subtraction', () => {
    const workDays: WorkDays = {
      group1: [
        { name: 'A1', from: m('09:00'), to: m('11:00'), subtractedTime: null },
        { name: 'A2', from: m('11:00'), to: m('12:00'), subtractedTime: null },
      ],
      group2: [{ name: 'B1', from: m('13:00'), to: m('14:00'), subtractedTime: null }],
    }

    const res = computeWorkTime(workDays, 0, m('09:00'), m('17:00'), m('08:00'), new Date(), 1)

    // Group A: only A2 gets default subtraction; Group B: B1 is last so gets default
    const eA1 = res.entries.find((e) => e.name === 'A1')!
    const eA2 = res.entries.find((e) => e.name === 'A2')!
    const eB1 = res.entries.find((e) => e.name === 'B1')!
    expect(eA1.subtractedTime).toBe('00:00')
    expect(eA2.subtractedTime).toBe('08:00')
    expect(eB1.subtractedTime).toBe('08:00')
  })

  it('propagates indices successfully', () => {
    const workDays: WorkDays = {
      group1: [
        { name: 'First', from: m('09:00'), to: m('10:00'), subtractedTime: null, idx: 5 },
        { name: 'Second', from: m('10:00'), to: m('12:00'), subtractedTime: null, idx: 7 },
      ],
      group2: [
        { name: 'First', from: m('09:00'), to: m('10:00'), subtractedTime: null, idx: 10 },
        { name: 'Second', from: m('10:00'), to: m('12:00'), subtractedTime: null, idx: 9 },
      ],
    }

    const res = computeWorkTime(workDays, 0, m('09:00'), m('17:00'), m('08:00'), new Date(), 1)

    expect(res.entries[0].idx).toBe(5)
    expect(res.entries[1].idx).toBe(7)
    expect(res.entries[2].idx).toBe(10)
    expect(res.entries[3].idx).toBe(9)
  })
})

describe('currentTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('rounds to the nearest precision in minutes (local time)', () => {
    // Set local time to 09:07
    vi.setSystemTime(new Date(2020, 0, 1, 9, 7, 0))
    expect(currentTime(5)).toBe(545) // 09:05

    vi.setSystemTime(new Date(2020, 0, 1, 9, 8, 0))
    expect(currentTime(5)).toBe(550) // 09:10
  })

  it('supports precision 1, 10, and 60', () => {
    vi.setSystemTime(new Date(2020, 0, 1, 9, 1, 0))
    expect(currentTime(1)).toBe(541)

    vi.setSystemTime(new Date(2020, 0, 1, 9, 4, 0))
    expect(currentTime(10)).toBe(540)

    vi.setSystemTime(new Date(2020, 0, 1, 9, 31, 0))
    expect(currentTime(60)).toBe(600)
  })

  it('throws on invalid precision (not integer, <= 0)', () => {
    vi.setSystemTime(new Date(2020, 0, 1, 9, 0, 0))
    expect(() => currentTime(0 as any)).toThrow()
    expect(() => currentTime(-5 as any)).toThrow()
    expect(() => currentTime(4.5 as any)).toThrow()
    expect(() => currentTime(Number.NaN as any)).toThrow()
  })
})
