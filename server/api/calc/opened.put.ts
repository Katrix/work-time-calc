import z from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const b = await readValidatedBody(event, z.object({ opened: z.number().array() }).parse)
  const drizzle = useDrizzle()

  await drizzle.delete(tables.openedCalc).where(eq(tables.openedCalc.userId, githubId)).execute()
  await drizzle
    .insert(tables.openedCalc)
    .values(b.opened.map((id) => ({ userId: githubId, calcId: id })))
    .execute()
  await drizzle.update(tables.user).set({ lastUpdatedOpenedCals: sql`now()` })

  setResponseStatus(event, 204)
})
