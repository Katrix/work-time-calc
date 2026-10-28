import z from 'zod'
import { presetPartSchema } from '#shared/types/preset'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const settings = await readValidatedBody(event, z.object({ hours: presetPartSchema, tasks: presetPartSchema }).parse)
  const presetId = await getPresetId(event, githubId, presetName)

  const allTags = [
    ...[...settings.hours.tags.entries()].map(([name, tag]) => ({ name, mode: 'hours' as const, color: tag })),
    ...[...settings.tasks.tags.entries()].map(([name, tag]) => ({ name, mode: 'tasks' as const, color: tag })),
  ]

  await usePrisma(event).preset.update({
    where: { id: presetId },
    data: {
      id: presetId,
      hoursWorkTime: settings.hours.workTime,
      hoursDefaultFrom: settings.hours.defaultFrom,
      hoursDefaultTo: settings.hours.defaultTo,
      hoursPrecision: settings.hours.precision,
      tasksPrecision: settings.tasks.precision,
      tags: {
        deleteMany: {
          presetId,
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
            presetId,
            presetMode: mode,
            name,
            color,
          },
          update: {
            presetId,
            presetMode: mode,
            name,
            color,
          },
        })),
      },
    },
  })

  await setPresetsUpdatedNow(event, githubId)
})
