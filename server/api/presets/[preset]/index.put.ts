import z from 'zod'
import { notInArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const p = await readValidatedBody(event, presetV2.parse)
  const drizzle = useDrizzle()

  await drizzle
    .insert(tables.preset)
    .values({
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
    })
    .onConflictDoUpdate({
      target: [tables.preset.id],
      set: {
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
      },
    })

  const presetId = await getPresetId(githubId, presetName)

  function insertPart(mode: 'hours' | 'tasks', part: PresetPart) {
    return [
      drizzle
        .insert(tables.presetPartTag)
        .values(
          [...part.tags.entries()].map(([tag, color]) => ({
            presetId,
            presetMode: mode,
            name: tag,
            color,
          })),
        )
        .onConflictDoUpdate({
          target: [tables.presetPartTag.presetId, tables.presetPartTag.presetMode, tables.presetPartTag.name],
          set: { color: sql.raw(`excluded.${tables.presetPartTag.color.name}`) },
        }),
      drizzle
        .delete(tables.presetPartTag)
        .where(
          and(
            eq(tables.presetPartTag.presetId, presetId),
            eq(tables.presetPartTag.presetMode, mode),
            notInArray(tables.presetPartTag.name, [...part.tags.keys()]),
          ),
        ),
    ] as const
  }

  await drizzle.batch([
    ...insertPart('hours', p.hours),
    ...insertPart('tasks', p.tasks),
    drizzle
      .insert(tables.presetGithubRepo)
      .values(
        [...p.github.entries()].flatMap(([ownerName, owner]) =>
          [...owner.repos.entries()].map(([repoName, repo]) => ({
            owner: ownerName,
            presetId,
            repo: repoName,
            autocompleteWithoutRepository: repo.autocompleteWithoutRepository,
          })),
        ),
      )
      .onConflictDoUpdate({
        target: [tables.presetGithubRepo.presetId, tables.presetGithubRepo.owner, tables.presetGithubRepo.repo],
        set: {
          autocompleteWithoutRepository: sql.raw(
            `excluded.${tables.presetGithubRepo.autocompleteWithoutRepository.name}`,
          ),
        },
      }),
    drizzle.delete(tables.presetGithubRepo).where(
      and(
        eq(tables.presetGithubRepo.presetId, presetId),
        notInArray(
          sql`concat(${tables.presetGithubRepo.owner}, '/', ${tables.presetGithubRepo.repo})`,
          [...p.github.entries()].map(([ownerName, owner]) =>
            [...owner.repos.keys()].map((repo) => `${ownerName}/${repo}`),
          ),
        ),
      ),
    ),
    drizzle
      .insert(tables.presetGithubOwner)
      .values(
        [...p.github.entries()].map(([ownerStr, owner]) => ({
          owner: ownerStr,
          presetId,
          active: owner.active,
          autocompleteWithoutOwner: owner.autocompleteWithoutOwner,
        })),
      )
      .onConflictDoNothing(),
    drizzle
      .delete(tables.presetGithubOwner)
      .where(
        and(
          eq(tables.presetGithubOwner.presetId, presetId),
          notInArray(tables.presetGithubOwner.owner, [...p.github.keys()]),
        ),
      ),
    drizzle
      .insert(tables.presetFixedHoliday)
      .values(
        p.holidayRules
          .filter((r) => r.type === 'fixed')
          .map((r) => ({ presetId, from: r.from.toString(), to: r.to.toString() })),
      ),
    drizzle.delete(tables.presetFixedHoliday).where(
      and(
        eq(tables.presetFixedHoliday.presetId, presetId),
        notInArray(
          sql`concat(${tables.presetFixedHoliday.from}, ' ', ${tables.presetFixedHoliday.to})`,
          p.holidayRules.filter((r) => r.type === 'fixed').map((r) => `${r.from} ${r.to}`),
        ),
      ),
    ),
    setPresetsUpdatedNow(githubId),
  ])

  return null
})
