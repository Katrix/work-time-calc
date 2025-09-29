import z from 'zod'
import { holidayRule } from './holiday'

export const repo = z.object({
  name: z.string(),
  autocompleteWithoutOwner: z.boolean(),
})
export type Repo = z.infer<typeof repo>

export const presetPart = z.object({
  workTime: z.string(),
  defaultFrom: z.string(),
  defaultTo: z.string(),
  precision: z.number(),
  tags: z.map(z.string(), z.string()),
  holidayRules: holidayRule.array(),
})
export type PresetPart = z.infer<typeof presetPart>

export const preset = z.object({
  hours: presetPart,
  tasks: presetPart,
  github: z.object({
    owners: z.string().array(),
    repos: z.map(z.string(), repo.array()),
  }),
})
export type Preset = z.infer<typeof preset>