import z from 'zod'
import { strToMinutes } from '../utils/ComputeWorkTime'
import { generateNKeysBetween } from 'fractional-indexing'

export const currentCalcVersion = 2

const recordMap = <T>(schema: z.ZodType<T>) => {
  return z.codec(z.record(z.string(), schema), z.map(z.string(), schema), {
    encode: (v) => Object.fromEntries(v.entries()) as Record<string, T>,
    decode: (v) => new Map(Object.entries(v)),
  })
}

export const calcEntryV2Schema = z.object({
  name: z.string(),
  rank: z.string(),
  from: z.int().nullable(),
  to: z.int().nullable(),
  subtractedTime: z.int().nullable(),
  notes: z.string().optional(),
  tags: z.string().array().optional(),
  isTracking: z.boolean().optional(),
})
export type CalcEntry = z.infer<typeof calcEntryV2Schema>

export const calcSchema = z.object({
  name: z.string(),
  mode: z.enum(['hours', 'tasks']),
  savedUpTime: z.int(),
  savedUpVacation: z.number(),
  workTime: z.int(),
  defaultFrom: z.int(),
  defaultTo: z.int().nullable(),
  precision: z.int(),
  tags: z.map(z.string(), z.string()).or(recordMap(z.string())),
})
export type Calc = z.infer<typeof calcSchema>

export const calcWithEntriesV2Schema = z.object({
  ...calcSchema.shape,
  version: z.literal(2),
  entries: calcEntryV2Schema.array(),
})
export type CalcWithEntries = z.infer<typeof calcWithEntriesV2Schema>

export function encodeCalcToString(calc: CalcWithEntries) {
  const data = {
    ...calc,
    tags: Object.fromEntries(calc.tags.entries()),
  } satisfies Omit<CalcWithEntries, 'tags'> & { tags: Record<string, string> }

  return JSON.stringify(data)
}

export function decodeCalcFromString(str: string): CalcWithEntries {
  const strDuration = z.string().transform((s) => strToMinutes(s))

  const jsonSchemaV1 = z
    .object({
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
          tags: z.array(z.string()).optional(),
          notes: z.string().optional(),
          idx: z.int().optional(),
          isTracking: z.boolean().optional(),
        }),
      ),
    })
    .transform((res) => {
      const ranks = generateNKeysBetween(null, null, res.workDays.length)
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
        entries: res.workDays.map((e, i) => {
          if ('day' in e) {
            const { day, ...other } = e
            return {
              ...other,
              rank: ranks[i],
              name: day ?? '',
            }
          } else
            return {
              ...e,
              rank: ranks[i],
              name: e.name ?? '',
            }
        }),
      } satisfies CalcWithEntries
    })

  const schema = z.discriminatedUnion('version', [jsonSchemaV1, calcWithEntriesV2Schema])

  return schema.parse(JSON.parse(str))
}
