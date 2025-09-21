import { Temporal } from '@js-temporal/polyfill'
import { easter } from 'date-easter'

export interface HolidayRuleBase {
  type: string
}

export interface FixedHolidayRule extends HolidayRuleBase {
  type: 'fixed'
  from: Temporal.PlainMonthDay
  to: Temporal.PlainMonthDay
}

export interface EasterHolidayRule extends HolidayRuleBase {
  type: 'easter'
}

export interface AscensionDayRule extends HolidayRuleBase {
  type: 'ascension'
}

export interface PentecostDayRule extends HolidayRuleBase {
  type: 'pentecost'
}

export interface ChristmasHolidayRule extends HolidayRuleBase {
  type: 'christmas'
}

export interface SaturdayHolidayRule extends HolidayRuleBase {
  type: 'saturday'
}

export interface SundayHolidayRule extends HolidayRuleBase {
  type: 'sunday'
}

export type HolidayRule =
  | FixedHolidayRule
  | EasterHolidayRule
  | ChristmasHolidayRule
  | AscensionDayRule
  | PentecostDayRule
  | SaturdayHolidayRule
  | SundayHolidayRule

function easterAlignedHolidays(year: number) {
  const easterSunday = Temporal.PlainDate.from(easter(year))
  return {
    easterSunday: easterSunday,
    easterMonday: easterSunday.add({ days: 1 }),
    goodFriday: easterSunday.subtract({ days: 2 }),
    maundyThursday: easterSunday.subtract({ days: 3 }),
    ascensionDay: easterSunday.add({ days: 39 }),
    whitSunday: easterSunday.add({ days: 49 }),
    whitMonday: easterSunday.add({ days: 50 }),
  }
}

function isHolidayByRule(date: Temporal.PlainDate, rule: HolidayRule): boolean {
  const easterHolidays = easterAlignedHolidays(date.year)
  switch (rule.type) {
    case 'fixed':
      const from = rule.from.toPlainDate({ year: date.year })
      const to = rule.to.toPlainDate({ year: date.year })

      return Temporal.PlainDate.compare(from, date) <= 0 && Temporal.PlainDate.compare(to, date) >= 0
    case 'easter':
      return (
        Temporal.PlainDate.compare(easterHolidays.easterSunday, date) === 0 ||
        Temporal.PlainDate.compare(easterHolidays.easterMonday, date) === 0 ||
        Temporal.PlainDate.compare(easterHolidays.goodFriday, date) === 0 ||
        Temporal.PlainDate.compare(easterHolidays.maundyThursday, date) === 0
      )

    case 'ascension':
      return Temporal.PlainDate.compare(easterHolidays.ascensionDay, date) === 0
    case 'pentecost':
      return (
        Temporal.PlainDate.compare(easterHolidays.whitMonday, date) === 0 ||
        Temporal.PlainDate.compare(easterHolidays.whitMonday, date) === 0
      )
    case 'christmas':
      return (
        isHolidayByRule(date, {
          type: 'fixed',
          from: Temporal.PlainMonthDay.from({ month: 12, day: 25 }),
          to: Temporal.PlainMonthDay.from({ month: 12, day: 26 }),
        }) ||
        isHolidayByRule(date, {
          type: 'fixed',
          from: Temporal.PlainMonthDay.from({ month: 1, day: 1 }),
          to: Temporal.PlainMonthDay.from({ month: 1, day: 1 }),
        })
      )
    case 'saturday':
      return date.dayOfWeek === 6
    case 'sunday':
      return date.dayOfWeek === 7
    default:
      throw new Error(`Unknown holiday rule type ${JSON.stringify(rule satisfies never)}`)
  }
}

export function isHoliday(date: Temporal.PlainDate, holidayRules: HolidayRule[]): boolean {
  for (const rule of holidayRules) {
    if (isHolidayByRule(date, rule)) {
      return true
    }
  }
  return false
}
