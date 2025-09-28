import z from 'zod'
import { holidayRuleSchema } from './holiday'

export const currentPresetVersion = 2

const repoV1Schema = z.object({
  name: z.string(),
  autocompleteWithoutOwner: z.boolean(),
})
export const repoV2Schema = z.object({
  autocompleteWithoutRepository: z.boolean(),
})
export type Repo = z.infer<typeof repoV2Schema>

const recordMap = <T>(schema: z.ZodType<T>) => {
  return z.codec(z.record(z.string(), schema), z.map(z.string(), schema), {
    encode: (v) => Object.fromEntries(v.entries()) as Record<string, T>,
    decode: (v) => new Map(Object.entries(v)),
  })
}

export const presetPartSchema = z.object({
  workTime: z.int(),
  defaultFrom: z.int(),
  defaultTo: z.int().nullable(),
  precision: z.int(),
  tags: z.map(z.string(), z.string()).or(recordMap(z.string())),
})
export type PresetPart = z.infer<typeof presetPartSchema>

const presetGithubV1Schema = z.object({
  owners: z.string().array(),
  repos: z.map(z.string(), repoV1Schema.array()).or(recordMap(repoV1Schema.array())),
})

export const presetGithubOwnerSchema = z.object({
  active: z.boolean(),
  autocompleteWithoutOwner: z.boolean(),
  repos: z.map(z.string(), repoV2Schema).or(recordMap(repoV2Schema)),
})
export type PresetGithubOwner = z.infer<typeof presetGithubOwnerSchema>

const presetV1Schema = z.object({
  version: z.literal(1).transform<typeof currentPresetVersion>(() => currentPresetVersion),
  hours: presetPartSchema,
  tasks: presetPartSchema,
  github: presetGithubV1Schema.transform(
    (github) =>
      new Map(
        [...github.repos.entries()].map(([owner, repos]) => [
          owner,
          {
            active: github.owners.includes(owner),
            autocompleteWithoutOwner: false,
            repos: new Map(
              repos.map((repo) => [
                repo.name,
                {
                  autocompleteWithoutRepository: false,
                },
              ]),
            ),
          },
        ]),
      ),
  ),
  holidayRules: holidayRuleSchema.array(),
})
export const presetV2Schema = z.object({
  version: z.literal(2),
  hours: presetPartSchema,
  tasks: presetPartSchema,
  github: z.map(z.string(), presetGithubOwnerSchema).or(recordMap(presetGithubOwnerSchema)),
  holidayRules: holidayRuleSchema.array(),
})

export type Preset = z.infer<typeof presetV2Schema>

export const allVersionsPresetSchema = z.discriminatedUnion('version', [presetV1Schema, presetV2Schema])
