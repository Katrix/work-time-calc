import z from 'zod'
import { Temporal } from '@js-temporal/polyfill'

const temporalPlainMonthDay = z.codec(z.string(), z.instanceof(Temporal.PlainMonthDay), {
  decode: (string) => Temporal.PlainMonthDay.from(string),
  encode: (temporal) => temporal.toJSON(),
})

export const fixedHolidayRuleSchema = z.object({
  type: z.literal('fixed'),
  from: temporalPlainMonthDay,
  to: temporalPlainMonthDay,
})
export type FixedHolidayRule = z.infer<typeof fixedHolidayRuleSchema>

export const easterHolidayRuleSchema = z.object({ type: z.literal('easter') })
export type EasterHolidayRule = z.infer<typeof easterHolidayRuleSchema>

export const ascensionHolidayRuleSchema = z.object({ type: z.literal('ascension') })
export type AscensionHolidayRule = z.infer<typeof ascensionHolidayRuleSchema>

export const pentecostHolidayRuleSchema = z.object({ type: z.literal('pentecost') })
export type PentecostHolidayRule = z.infer<typeof pentecostHolidayRuleSchema>

export const christmasHolidayRuleSchema = z.object({ type: z.literal('christmas') })
export type ChristmasHolidayRule = z.infer<typeof christmasHolidayRuleSchema>

export const saturdayHolidayRuleSchema = z.object({ type: z.literal('saturday') })
export type SaturdayHolidayRule = z.infer<typeof saturdayHolidayRuleSchema>

export const sundayHolidayRuleSchema = z.object({ type: z.literal('sunday') })
export type SundayHolidayRule = z.infer<typeof sundayHolidayRuleSchema>

export const holidayRuleSchema = z.discriminatedUnion('type', [
  fixedHolidayRuleSchema,
  easterHolidayRuleSchema,
  ascensionHolidayRuleSchema,
  pentecostHolidayRuleSchema,
  christmasHolidayRuleSchema,
  saturdayHolidayRuleSchema,
  sundayHolidayRuleSchema,
])
export type HolidayRule = z.infer<typeof holidayRuleSchema>