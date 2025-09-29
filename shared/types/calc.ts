import z from 'zod'

export const workRange = z.object({
  name: z.string(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  subtractedTime: z.string().nullable(),
  notes: z.string().optional(),
  idx: z.number().optional(),
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
  savedUpTime: z.string(),
  savedUpVacation: z.string(),
  workTime: z.string(),
  defaultFrom: z.string(),
  defaultTo: z.string(),
  precision: z.number(),
  tags: z.map(z.string(), z.string()),
})
export type Calc = z.infer<typeof calc>

export const calcWithEntries = z.intersection(calc, z.object({ entries: calcEntry.array() }))
export type CalcWithEntries = z.infer<typeof calcWithEntries>
