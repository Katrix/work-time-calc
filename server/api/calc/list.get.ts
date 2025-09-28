export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return await usePrisma(event).calc.findMany({
    where: {
      createdById: githubId,
    },
    select: {
      publicId: true,
      name: true,
      mode: true,
    },
  })
})
