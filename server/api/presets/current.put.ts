import z from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const p = await readValidatedBody(event, z.object({ preset: z.string() }).parse)

  const presetId = await getPresetId(event, githubId, p.preset)

  await usePrisma(event).user.update({
    where: { id: githubId },
    data: { currentPresetId: presetId },
  })

  setResponseStatus(event, 204)
})