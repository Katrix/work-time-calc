import z from 'zod'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  const p = await readValidatedBody(event, z.object({ from: z.string(), to: z.string() }).parse)

  if (p.from === p.to || !isValidPresetName(p.to)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid name' })
  }

  const existing = await usePrisma(event).preset.count({ where: { createdById: githubId, name: p.to } })
  if (existing > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Another present with that name already exists' })
  }

  const res = await usePrisma(event).preset.updateMany({
    data: {
      name: p.to,
    },
    where: {
      name: p.from,
      createdById: githubId,
    },
  })

  if (res.count === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  await setPresetsUpdatedNow(event, githubId)

  return null
})
