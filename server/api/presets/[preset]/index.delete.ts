import z from 'zod'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse, {
    decode: true,
  })

  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  const presetId = await getPresetId(event, githubId, presetName)

  await usePrisma(event).preset.delete({
    where: { id: presetId },
  })

  await setPresetsUpdatedNow(event, githubId)

  return null
})
