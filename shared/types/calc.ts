import z from 'zod'

export const workRange = z.object({
  name: z.string(),
  from: z.int().nullable(),
  to: z.int().nullable(),
  subtractedTime: z.int().nullable(),
  notes: z.string().optional(),
  idx: z.int().optional(),
  tags: z.string().array().optional(),
})
export type WorkRange = z.infer<typeof workRange>

export const calcEntry = z.intersection(
  workRange,
  z.object({
    customSubtractedTime: z.boolean(),
    isTracking: z.boolean().optional(),
  }),
)
export type CalcEntry = z.infer<typeof calcEntry>

export const calc = z.object({
  name: z.string(),
  mode: z.enum(['hours', 'tasks']),
  savedUpTime: z.int(),
  savedUpVacation: z.number(),
  workTime: z.int(),
  defaultFrom: z.int(),
  defaultTo: z.int(),
  precision: z.int(),
  tags: z.map(z.string(), z.string()),
})
export type Calc = z.infer<typeof calc>

export const calcWithEntries = z.intersection(calc, z.object({ entries: calcEntry.array() }))
export type CalcWithEntries = z.infer<typeof calcWithEntries>
