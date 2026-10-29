export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  return await usePrisma(event).sharedTag.findMany({
    select: {
      publicId: true,
      name: true,
      color: true,
    },
    where: {
      createdById: githubId,
    },
  })
})
