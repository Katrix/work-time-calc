import z from 'zod'
import { strToMinutes } from '../utils/ComputeWorkTime'

export const currentCalcVersion = 1

const recordMap = <T>(schema: z.ZodType<T>) => {
  return z.codec(z.record(z.string(), schema), z.map(z.string(), schema), {
    encode: (v) => Object.fromEntries(v.entries()) as Record<string, T>,
    decode: (v) => new Map(Object.entries(v)),
  })
}

export const calcEntry = z.object({
  name: z.string(),
  from: z.int().nullable(),
  to: z.int().nullable(),
  subtractedTime: z.int().nullable(),
  notes: z.string().optional(),
  idx: z.int().optional(),
  tags: z.string().array().optional(),
  isTracking: z.boolean().optional(),
  customSubtractedTime: z.boolean().optional(),
})
export type CalcEntry = z.infer<typeof calcEntry>

export const calc = z.object({
  version: z.literal(1),
  name: z.string(),
  mode: z.enum(['hours', 'tasks']),
  savedUpTime: z.int(),
  savedUpVacation: z.number(),
  workTime: z.int(),
  defaultFrom: z.int(),
  defaultTo: z.int(),
  precision: z.int(),
  tags: z.map(z.string(), z.string()).or(recordMap(z.string())),
})
export type Calc = z.infer<typeof calc>

export const calcWithEntries = z.intersection(calc, z.object({ entries: calcEntry.array() }))
export type CalcWithEntries = z.infer<typeof calcWithEntries>

export function encodeCalcToString(calc: CalcWithEntries) {
  const data = {
    version: currentCalcVersion,
    mode: calc.mode,
    name: calc.name,
    savedUpTime: calc.savedUpTime,
    savedUpVacation: calc.savedUpVacation,
    workTime: calc.workTime,
    defaultFrom: calc.defaultFrom,
    defaultTo: calc.defaultTo,
    precision: calc.precision,
    tags: Object.fromEntries(calc.tags.entries()),
    workDays: calc.entries.map((e) => ({
      name: e.name,
      from: e.from,
      to: e.to,
      subtractedTime: e.subtractedTime,
      customSubtractedTime: e.customSubtractedTime,
      tags: e.tags,
      notes: e.notes,
      idx: e.idx,
    })),
  }

  return JSON.stringify(data)
}

export function decodeCalcFromString(str: string): CalcWithEntries {
  const strDuration = z.string().transform((s) => strToMinutes(s))

  const jsonSchema = z.object({
    version: z.literal(1).default(1),
    mode: z.enum(['hours', 'tasks']).optional().default('hours'),
    name: z.string().optional().default(''),
    savedUpTime: z.int().optional().or(strDuration),
    savedUp: strDuration.optional(),
    savedUpVacation: z
      .number()
      .optional()
      .or(
        z
          .string()
          .transform((s) => Number(s.replaceAll(',', '.')))
          .optional(),
      )
      .default(0),
    workTime: z.int().or(strDuration),
    defaultFrom: z.int().or(strDuration),
    defaultTo: z.int().or(strDuration),
    precision: z.int().optional().default(5),
    tags: z
      .map(z.string(), z.string())
      .or(recordMap(z.string()))
      .default(() => new Map()),
    workDays: z.array(
      z.object({
        name: z.string().optional(),
        day: z.string().optional(),
        from: z.int().or(strDuration).nullable(),
        to: z.int().or(strDuration).nullable(),
        subtractedTime: z.int().nullable().or(strDuration.nullable().default(null)),
        customSubtractedTime: z.boolean().optional().default(false),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        idx: z.int().optional(),
      }),
    ),
  })

  const res = jsonSchema.parse(JSON.parse(str))

  return {
    version: currentCalcVersion,
    name: res.name,
    mode: res.mode,
    savedUpTime: res.savedUpTime ?? res.savedUp ?? 0,
    savedUpVacation: res.savedUpVacation,
    workTime: res.workTime,
    defaultFrom: res.defaultFrom,
    defaultTo: res.defaultTo,
    precision: res.precision,
    tags: res.tags,
    entries: res.workDays.map((e) => {
      if ('day' in e) {
        const { day, ...other } = e
        return {
          ...other,
          name: day ?? '',
        }
      } else
        return {
          ...e,
          name: e.name ?? '',
        }
    }),
  }
}
