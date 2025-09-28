export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return await useDrizzle().query.calc.findMany({
    columns: {
      id: true,
      name: true,
      mode: true,
    },
    where: (table, { eq }) => eq(table.createdById, githubId),
  })
})
