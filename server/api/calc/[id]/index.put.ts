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

  const c = await readValidatedBody(event, calc.parse)
  const drizzle = useDrizzle()

  await drizzle
    .update(tables.calc)
    .set({
      createdById: githubId,
      updatedAt: sql`now()`,
      name: c.name,
      mode: c.mode,
      savedUpTime: c.savedUpTime,
      savedUpVacation: c.savedUpVacation,
      workTime: c.workTime,
      defaultFrom: c.defaultFrom,
      defaultTo: c.defaultTo,
      precision: c.precision,
    })
    .where(and(eq(tables.calc.id, calcId), eq(tables.calc.createdById, githubId)))

  setResponseStatus(event, 204)
})
