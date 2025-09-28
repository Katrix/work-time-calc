export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const c = await readValidatedBody(event, calc.parse)
  const drizzle = useDrizzle()

  const res = await drizzle
    .insert(tables.calc)
    .values({
      createdById: githubId,
      name: c.name,
      mode: c.mode,
      savedUpTime: c.savedUpTime,
      savedUpVacation: c.savedUpVacation,
      workTime: c.workTime,
      defaultFrom: c.defaultFrom,
      defaultTo: c.defaultTo,
      precision: c.precision,
    })
    .returning({ id: tables.calc.id })

  setResponseStatus(event, 201)

  return { id: res[0] }
})
