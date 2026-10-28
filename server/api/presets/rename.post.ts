import z from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const p = await readValidatedBody(event, z.object({ from: z.string(), to: z.string() }).parse)

  if (p.from === p.to || p.to === '' || p.to.includes('/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid name' })
  }

  const res = await usePrisma(event).preset.updateMany({
    data: {
      name: p.to
    },
    where: {
      name: p.from,
      createdById: githubId,
    }
  })

  if (res.count === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  await setPresetsUpdatedNow(event, githubId)

  return null
})
