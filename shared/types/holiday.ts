import z from 'zod'
import { Temporal } from '@js-temporal/polyfill'

const temporalPlainMonthDay = z.codec(z.string(), z.instanceof(Temporal.PlainMonthDay), {
  decode: (string) => Temporal.PlainMonthDay.from(string),
  encode: (temporal) => temporal.toJSON(),
})

export const fixedHolidayRule = z.object({
  type: z.literal('fixed'),
  from: temporalPlainMonthDay,
  to: temporalPlainMonthDay,
})
export type FixedHolidayRule = z.infer<typeof fixedHolidayRule>

export const easterHolidayRule = z.object({ type: z.literal('easter') })
export type EasterHolidayRule = z.infer<typeof easterHolidayRule>

export const ascensionHolidayRule = z.object({ type: z.literal('ascension') })
export type AscensionHolidayRule = z.infer<typeof ascensionHolidayRule>

export const pentecostHolidayRule = z.object({ type: z.literal('pentecost') })
export type PentecostHolidayRule = z.infer<typeof pentecostHolidayRule>

export const christmasHolidayRule = z.object({ type: z.literal('christmas') })
export type ChristmasHolidayRule = z.infer<typeof christmasHolidayRule>

export const saturdayHolidayRule = z.object({ type: z.literal('saturday') })
export type SaturdayHolidayRule = z.infer<typeof saturdayHolidayRule>

export const sundayHolidayRule = z.object({ type: z.literal('sunday') })
export type SundayHolidayRule = z.infer<typeof sundayHolidayRule>

export const holidayRule = z.discriminatedUnion('type', [
  fixedHolidayRule,
  easterHolidayRule,
  ascensionHolidayRule,
  pentecostHolidayRule,
  christmasHolidayRule,
  saturdayHolidayRule,
  sundayHolidayRule,
])
export type HolidayRule = z.infer<typeof holidayRule>