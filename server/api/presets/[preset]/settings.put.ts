import z from 'zod'
import { presetPartSchema } from '#shared/types/preset'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse, {
    decode: true,
  })

  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  const settings = await readValidatedBody(event, z.object({ hours: presetPartSchema, tasks: presetPartSchema }).parse)
  const presetId = await getPresetId(event, githubId, presetName)

  await usePrisma(event).preset.update({
    where: { id: presetId },
    data: {
      id: presetId,
      hoursWorkTime: settings.hours.workTime,
      hoursDefaultFrom: settings.hours.defaultFrom,
      hoursDefaultTo: settings.hours.defaultTo,
      hoursPrecision: settings.hours.precision,
      tasksPrecision: settings.tasks.precision,
    },
  })

  await setPresetsUpdatedNow(event, githubId)
})
