import z from 'zod'
import { notInArray } from 'drizzle-orm'
import { presetPart } from '#shared/types/preset'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const settings = await readValidatedBody(event, z.object({ hours: presetPart, tasks: presetPart }).parse)
  const drizzle = useDrizzle()

  const presetId = await getPresetId(githubId, presetName)

  await drizzle.batch([
    drizzle.update(tables.preset).set({
      id: presetId,
      hoursWorkTime: settings.hours.workTime,
      hoursDefaultFrom: settings.hours.defaultFrom,
      hoursDefaultTo: settings.hours.defaultTo,
      hoursPrecision: settings.hours.precision,
      tasksPrecision: settings.tasks.precision,
    }),
    drizzle
      .insert(tables.presetPartTag)
      .values(
        [
          ...[...settings.hours.tags.entries()].map((t) => ['hours', t] as const),
          ...[...settings.tasks.tags.entries()].map((t) => ['tasks', t] as const),
        ].map(([mode, [tag, color]]) => ({
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
          notInArray(tables.presetPartTag.name, [...settings.hours.tags.keys(), ...settings.tasks.tags.keys()]),
        ),
      ),
    setPresetsUpdatedNow(githubId),
  ])
})
