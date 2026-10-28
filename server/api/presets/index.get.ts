import { Temporal } from '@js-temporal/polyfill'
import type { PresetGithubOwner, Repo } from '#shared/types/preset'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId

  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: `Unauthorized, ${JSON.stringify(session)}` })
  }

  const userInfo = await usePrisma(event).user.findUnique({
    where: { id: githubId },
    include: {
      currentPreset: {
        select: {
          name: true,
        },
      },
    },
  })

  const res = await usePrisma(event).preset.findMany({
    include: {
      tags: true,
      githubOwners: {
        include: {
          repos: {
            select: {
              repo: true,
              autocompleteWithoutRepository: true,
            },
          },
        },
      },
      fixedHolidays: true,
    },
    where: {
      createdById: githubId,
    },
  })

  return {
    lastUpdated: userInfo?.lastUpdatedPresets,
    currentPreset: userInfo?.currentPreset?.name,
    presets: Object.fromEntries(
      res.map((rawPreset) => {
        const github = new Map<
          string,
          Omit<PresetGithubOwner, 'repos'> & {
            repos: Record<string, Repo>
          }
        >()

        for (const githubOwner of rawPreset.githubOwners) {
          const owner: Omit<PresetGithubOwner, 'repos'> & {
            repos: Record<string, Repo>
          } = {
            active: githubOwner.active,
            autocompleteWithoutOwner: githubOwner.autocompleteWithoutOwner,
            repos: {},
          }

          for (const repo of githubOwner.repos) {
            owner.repos[repo.repo] = {
              autocompleteWithoutRepository: repo.autocompleteWithoutRepository,
            }
          }

          github.set(githubOwner.owner, owner)
        }

        const holidayRules: HolidayRule[] = []
        for (const fixedHoliday of rawPreset.fixedHolidays) {
          const from = Temporal.PlainMonthDay.from(fixedHoliday.from)
          const to = Temporal.PlainMonthDay.from(fixedHoliday.to)
          holidayRules.push({ type: 'fixed', from, to })
        }
        if (rawPreset.easterHoliday) {
          holidayRules.push({ type: 'easter' })
        }
        if (rawPreset.ascensionHoliday) {
          holidayRules.push({ type: 'ascension' })
        }
        if (rawPreset.pentecostHoliday) {
          holidayRules.push({ type: 'pentecost' })
        }
        if (rawPreset.christmasHoliday) {
          holidayRules.push({ type: 'christmas' })
        }
        if (rawPreset.saturdayHoliday) {
          holidayRules.push({ type: 'saturday' })
        }
        if (rawPreset.sundayHoliday) {
          holidayRules.push({ type: 'sunday' })
        }

        return [
          rawPreset.name,
          {
            version: currentPresetVersion,
            hours: {
              workTime: rawPreset.hoursWorkTime,
              defaultFrom: rawPreset.hoursDefaultFrom,
              defaultTo: rawPreset.hoursDefaultTo,
              precision: rawPreset.hoursPrecision,
              tags: new Map(rawPreset.tags.filter((t) => t.presetMode === 'hours').map((t) => [t.name, t.color])),
            },
            tasks: {
              workTime: 0,
              defaultFrom: 0,
              defaultTo: 0,
              precision: rawPreset.tasksPrecision,
              tags: new Map(rawPreset.tags.filter((t) => t.presetMode === 'tasks').map((t) => [t.name, t.color])),
            },
            github: Object.fromEntries(github.entries()),
            holidayRules,
          } satisfies Omit<Preset, 'github'> & {
            github: Record<
              string,
              Omit<PresetGithubOwner, 'repos'> & {
                repos: Record<string, Repo>
              }
            >
          },
        ]
      }),
    ),
  }
})
