import { Temporal } from '@js-temporal/polyfill'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userInfo = await useDrizzle().query.user.findFirst({
    columns: {
      lastUpdatedPresets: true,
    },
    with: {
      currentPreset: {
        columns: {
          name: true,
        },
      },
    },
    where: (table, { eq }) => eq(table.id, githubId),
  })

  const res = await useDrizzle().query.preset.findMany({
    with: {
      presetPartTags: true,
      githubRepos: {
        columns: {
          owner: true,
          repo: true,
          autocompleteWithoutOwner: true,
        },
      },
      githubOwners: {
        columns: {
          owner: true,
        },
      },
      fixedHolidays: true,
    },
    where: (table, { eq }) => eq(table.createdById, githubId),
  })

  return {
    lastUpdated: userInfo?.lastUpdatedPresets ?? 0,
    currentPreset: userInfo?.currentPreset?.name,
    presets: Object.fromEntries(
      res.map((rawPreset) => {
        const reposMap = new Map<string, Repo[]>()
        for (const repo of rawPreset.githubRepos) {
          let arr = reposMap.get(repo.owner)
          if (!arr) {
            arr = []
            reposMap.set(repo.owner, arr)
          }

          arr.push({ name: repo.repo, autocompleteWithoutOwner: repo.autocompleteWithoutOwner })
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
              tags: new Map(
                rawPreset.presetPartTags.filter((t) => t.presetMode === 'hours').map((t) => [t.name, t.color]),
              ),
            },
            tasks: {
              workTime: 0,
              defaultFrom: 0,
              defaultTo: 0,
              precision: rawPreset.tasksPrecision,
              tags: new Map(
                rawPreset.presetPartTags.filter((t) => t.presetMode === 'tasks').map((t) => [t.name, t.color]),
              ),
            },
            github: {
              owners: rawPreset.githubOwners.map((owner) => owner.owner),
              repos: reposMap,
            },
            holidayRules: holidayRules,
          } satisfies Preset,
        ]
      }),
    ),
  }
})
