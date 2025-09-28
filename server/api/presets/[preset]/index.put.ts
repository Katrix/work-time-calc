import z from 'zod'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse)

  if (presetName === '' || presetName.includes('/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid preset name' })
  }

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const p = await readValidatedBody(event, presetV2Schema.parse)
  const prisma = usePrisma(event)

  const allTags = [
    ...[...p.hours.tags.entries()].map(([name, tag]) => ({ name, mode: 'hours' as const, color: tag })),
    ...[...p.tasks.tags.entries()].map(([name, tag]) => ({ name, mode: 'tasks' as const, color: tag })),
  ]

  const presetIdObj = await usePrisma(event).preset.findUnique({
    select: { id: true },
    where: {
      createdById_name: {
        createdById: githubId,
        name: presetName,
      },
    },
  })

  if (!presetIdObj) {
    await prisma.preset.create({
      data: {
        name: presetName,
        createdById: githubId,

        hoursWorkTime: p.hours.workTime,
        hoursDefaultFrom: p.hours.defaultFrom,
        hoursDefaultTo: p.hours.defaultTo,
        hoursPrecision: p.hours.precision,
        tasksPrecision: p.tasks.precision,

        easterHoliday: p.holidayRules.some((r) => r.type === 'easter'),
        ascensionHoliday: p.holidayRules.some((r) => r.type === 'ascension'),
        pentecostHoliday: p.holidayRules.some((r) => r.type === 'pentecost'),
        christmasHoliday: p.holidayRules.some((r) => r.type === 'christmas'),
        saturdayHoliday: p.holidayRules.some((r) => r.type === 'saturday'),
        sundayHoliday: p.holidayRules.some((r) => r.type === 'sunday'),
        fixedHolidays: {
          create: p.holidayRules
            .filter((r) => r.type === 'fixed')
            .map((r) => ({
              from: r.from.toString(),
              to: r.to.toString(),
            })),
        },
        githubOwners: {
          create: Object.entries(p.github).map(([owner, ownerData]) => ({
            owner,
            active: ownerData.active,
            autocompleteWithoutOwner: ownerData.autocompleteWithoutOwner,
          })),
        },
        githubRepos: {
          create: Object.entries(p.github).flatMap(([owner, { repos }]) =>
            [...repos.entries()].map(([repo, repoData]) => ({
              owner,
              repo,
              autocompleteWithoutRepository: repoData.autocompleteWithoutRepository,
            })),
          ),
        },
        tags: {
          create: allTags.map(({ name, mode, color }) => ({
            presetMode: mode,
            name,
            color,
          })),
        },
      },
    })
  } else {
    const presetId = presetIdObj.id
    await prisma.preset.update({
      where: {
        createdById_name: {
          createdById: githubId,
          name: presetName,
        },
      },
      data: {
        hoursWorkTime: p.hours.workTime,
        hoursDefaultFrom: p.hours.defaultFrom,
        hoursDefaultTo: p.hours.defaultTo,
        hoursPrecision: p.hours.precision,
        tasksPrecision: p.tasks.precision,

        easterHoliday: p.holidayRules.some((r) => r.type === 'easter'),
        ascensionHoliday: p.holidayRules.some((r) => r.type === 'ascension'),
        pentecostHoliday: p.holidayRules.some((r) => r.type === 'pentecost'),
        christmasHoliday: p.holidayRules.some((r) => r.type === 'christmas'),
        saturdayHoliday: p.holidayRules.some((r) => r.type === 'saturday'),
        sundayHoliday: p.holidayRules.some((r) => r.type === 'sunday'),
        fixedHolidays: {
          deleteMany: {
            NOT: {
              OR: p.holidayRules
                .filter((r) => r.type === 'fixed')
                .map((r) => ({ from: r.from.toString(), to: r.to.toString() })),
            },
          },
          create: p.holidayRules
            .filter((r) => r.type === 'fixed')
            .map((r) => ({
              from: r.from.toString(),
              to: r.to.toString(),
            })),
        },
        githubOwners: {
          deleteMany: {
            NOT: {
              owner: {
                in: Object.keys(p.github),
              },
            },
          },
          upsert: Object.entries(p.github).map(([owner, ownerData]) => ({
            where: {
              presetId_owner: {
                presetId,
                owner,
              },
            },
            create: {
              owner,
              active: ownerData.active,
              autocompleteWithoutOwner: ownerData.autocompleteWithoutOwner,
            },
            update: {
              owner,
              active: ownerData.active,
              autocompleteWithoutOwner: ownerData.autocompleteWithoutOwner,
            },
          })),
        },
        githubRepos: {
          deleteMany: {
            NOT: {
              OR: Object.entries(p.github).flatMap(([owner, { repos }]) =>
                [...repos.keys()].map((repo) => ({
                  owner,
                  repo,
                })),
              ),
            },
          },
          upsert: Object.entries(p.github).flatMap(([owner, { repos }]) =>
            [...repos.entries()].map(([repo, repoData]) => ({
              where: {
                presetId_owner_repo: {
                  presetId,
                  owner,
                  repo,
                },
              },
              create: {
                owner,
                repo,
                autocompleteWithoutRepository: repoData.autocompleteWithoutRepository,
              },
              update: {
                owner,
                repo,
                autocompleteWithoutRepository: repoData.autocompleteWithoutRepository,
              },
            })),
          ),
        },
        tags: {
          deleteMany: {
            NOT: { name: { in: allTags.map(({ name }) => name) } },
          },
          upsert: allTags.map(({ name, mode, color }) => ({
            where: {
              presetId_presetMode_name: {
                presetId,
                presetMode: mode,
                name,
              },
            },
            create: {
              presetMode: mode,
              name,
              color,
            },
            update: {
              presetMode: mode,
              name,
              color,
            },
          })),
        },
      },
    })
  }

  await setPresetsUpdatedNow(event, githubId)

  return null
})
