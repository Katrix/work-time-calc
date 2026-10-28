export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  return await usePrisma(event).calc.findMany({
    where: {
      createdById: githubId,
    },
    select: {
      publicId: true,
      name: true,
      mode: true,
      updatedAt: true,
    },
  })
})
