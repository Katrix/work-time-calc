import z from 'zod'
import { notInArray } from 'drizzle-orm'

export const modeHandler = (mode: 'hours' | 'tasks') => defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const part = await readValidatedBody(event, presetPart.parse)
  const drizzle = useDrizzle()

  await drizzle.batch([
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
  ])

  setResponseStatus(event, 204)
})