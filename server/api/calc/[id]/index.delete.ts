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

  await drizzle
    .delete(tables.calc)
    .where(and(eq(tables.calc.id, calcId), eq(tables.calc.createdById, githubId)))

  setResponseStatus(event, 204)
})
