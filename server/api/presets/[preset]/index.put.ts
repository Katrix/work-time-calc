import z from 'zod'
import { notInArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const p = await readValidatedBody(event, preset.parse)
  const drizzle = useDrizzle()

  function insertPart(mode: 'hours' | 'tasks', part: PresetPart) {
    return [
      drizzle
        .insert(tables.presetPart)
        .values({
          mode,
          partOfName: presetName,
          workTime: part.workTime,
          defaultFrom: part.defaultFrom,
          defaultTo: part.defaultTo,
          precision: part.precision,
        })
        .onConflictDoUpdate({
          target: [tables.presetPart.partOfName, tables.presetPart.mode],
          set: {
            workTime: part.workTime,
            defaultFrom: part.defaultFrom,
            defaultTo: part.defaultTo,
            precision: part.precision,
          },
        }),
      drizzle
        .insert(tables.presetPartTag)
        .values(
          [...part.tags.entries()].map(([tag, color]) => ({
            presetMode: mode,
            presetPartOfName: presetName,
            name: tag,
            color,
          })),
        )
        .onConflictDoUpdate({
          target: [tables.presetPartTag.presetPartOfName, tables.presetPartTag.presetMode, tables.presetPartTag.name],
          set: { color: sql.raw(`excluded.${tables.presetPartTag.color.name}`) },
        }),
      drizzle
        .delete(tables.presetPartTag)
        .where(
          and(
            eq(tables.presetPartTag.presetMode, mode),
            eq(tables.presetPartTag.presetPartOfName, presetName),
            notInArray(tables.presetPartTag.name, [...part.tags.keys()]),
          ),
        ),
    ]
  }

  await drizzle.batch([
    drizzle
      .insert(tables.preset)
      .values({
        name: presetName,
        createdById: githubId,
      })
      .onConflictDoNothing(),
    ...insertPart('hours', p.hours),
    ...insertPart('tasks', p.tasks),
    drizzle
      .insert(tables.presetGithubRepo)
      .values(
        [...p.github.repos.entries()].flatMap(([owner, repos]) =>
          repos.map((repo) => ({
            owner,
            repo: repo.name,
            partOfName: presetName,
            autocompleteWithoutOwner: repo.autocompleteWithoutOwner,
          })),
        ),
      )
      .onConflictDoUpdate({
        target: [tables.presetGithubRepo.partOfName, tables.presetGithubRepo.owner, tables.presetGithubRepo.repo],
        set: { autocompleteWithoutOwner: sql.raw(`excluded.${tables.presetGithubRepo.autocompleteWithoutOwner.name}`) },
      }),
    drizzle.delete(tables.presetGithubRepo).where(
      and(
        eq(tables.presetGithubRepo.partOfName, presetName),
        notInArray(
          sql`concat(${tables.presetGithubRepo.owner}, '/', ${tables.presetGithubRepo.repo})`,
          [...p.github.repos.entries()].map(([owner, repos]) => repos.map((repo) => `${owner}/${repo.name}`)),
        ),
      ),
    ),
    drizzle
      .insert(tables.presetGithubOwner)
      .values(p.github.owners.map((owner) => ({ owner, partOfName: presetName })))
      .onConflictDoNothing(),
    drizzle
      .delete(tables.presetGithubOwner)
      .where(
        and(
          eq(tables.presetGithubOwner.partOfName, presetName),
          notInArray(tables.presetGithubOwner.owner, p.github.owners),
        ),
      ),
  ])

  setResponseStatus(event, 204)
})
