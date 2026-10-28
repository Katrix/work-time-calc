export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const res = await usePrisma(event).user.findUnique({
    where: {
      id: githubId,
    },
    include: {
      openedCalcs: {
        select: {
          calc: {
            select: {
              publicId: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  if (!res) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return {
    lastUpated: res.lastUpatedOpenedCalcs,
    opened: res.openedCalcs.map((r) => r.calc.publicId),
  }
})
