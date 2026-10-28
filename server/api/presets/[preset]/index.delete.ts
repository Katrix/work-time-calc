import z from 'zod'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse, {
    decode: true,
  })

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const presetId = await getPresetId(event, githubId, presetName)

  await usePrisma(event).preset.delete({
    where: { id: presetId },
  })

  await setPresetsUpdatedNow(event, githubId)

  return null
})
