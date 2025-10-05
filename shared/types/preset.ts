import z from 'zod'
import { holidayRule } from './holiday'

export const currentPresetVersion = 1

export const repo = z.object({
  name: z.string(),
  autocompleteWithoutOwner: z.boolean(),
})
export type Repo = z.infer<typeof repo>

const recordMap = <T>(schema: z.ZodType<T>) => {
  return z.codec(z.record(z.string(), schema), z.map(z.string(), schema), {
    encode: (v) => Object.fromEntries(v.entries()) as Record<string, T>,
    decode: (v) => new Map(Object.entries(v)),
  })
}

export const presetPart = z.object({
  workTime: z.int(),
  defaultFrom: z.int(),
  defaultTo: z.int(),
  precision: z.int(),
  tags: z.map(z.string(), z.string()).or(recordMap(z.string())),
})
export type PresetPart = z.infer<typeof presetPart>

export const presetGithub = z.object({
  owners: z.string().array(),
  repos: z.map(z.string(), repo.array()).or(recordMap(repo.array())),
})
export type PresetGithub = z.infer<typeof presetGithub>

export const preset = z.object({
  version: z.literal(1),
  hours: presetPart,
  tasks: presetPart,
  github: presetGithub,
  holidayRules: holidayRule.array(),
})
export type Preset = z.infer<typeof preset>

export const allVersionsPreset = preset
