export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const res2 = await useDrizzle().query.user.findFirst({
    columns: {
      lastUpdatedOpenedCals: true,
    },
    with: {
      openedCalcs: {
        columns: {
          calcId: true,
        },
      },
    },
    where: (table, { eq }) => eq(table.id, githubId),
  })

  if (!res2) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return {
    lastUpated: res2.lastUpdatedOpenedCals,
    opened: res2.openedCalcs.map((r) => r.calcId),
  }
})
