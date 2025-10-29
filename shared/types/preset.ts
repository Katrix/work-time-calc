import z from 'zod'
import { holidayRule } from './holiday'

export const currentPresetVersion = 2

const repoV1 = z.object({
  name: z.string(),
  autocompleteWithoutOwner: z.boolean(),
})
export const repoV2 = z.object({
  autocompleteWithoutRepository: z.boolean(),
})
export type Repo = z.infer<typeof repoV2>

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

const presetGithubV1 = z.object({
  owners: z.string().array(),
  repos: z.map(z.string(), repoV1.array()).or(recordMap(repoV1.array())),
})

export const presetGithubOwner = z.object({
  active: z.boolean(),
  autocompleteWithoutOwner: z.boolean(),
  repos: z.map(z.string(), repoV2).or(recordMap(repoV2)),
})
export type PresetGithubOwner = z.infer<typeof presetGithubOwner>

const presetV1 = z.object({
  version: z.literal(1).transform<typeof currentPresetVersion>(() => currentPresetVersion),
  hours: presetPart,
  tasks: presetPart,
  github: presetGithubV1.transform(
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
  holidayRules: holidayRule.array(),
})
export const presetV2 = z.object({
  version: z.literal(2),
  hours: presetPart,
  tasks: presetPart,
  github: z.map(z.string(), presetGithubOwner).or(recordMap(presetGithubOwner)),
  holidayRules: holidayRule.array(),
})

export type Preset = z.infer<typeof presetV2>

export const allVersionsPreset = z.discriminatedUnion('version', [presetV1, presetV2])
