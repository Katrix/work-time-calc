import z from 'zod'

export default defineEventHandler(async (event) => {
  const { id: calcId } = await getValidatedRouterParams(
    event,
    z.object({ id: z.string().pipe(z.coerce.number()) }).parse,
  )

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const drizzle = useDrizzle()
  const res = await drizzle.query.calc.findFirst({
    with: {
      entries: {
        with: {
          tags: true,
        },
      },
      tags: true,
    },
    where: (table) => and(eq(table.id, calcId), eq(table.createdById, githubId)),
  })

  if (!res) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return res
})
