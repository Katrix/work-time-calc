import z from 'zod'
import { exists } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { id: calcId, entryId } = await getValidatedRouterParams(
    event,
    z.object({ id: z.string().pipe(z.coerce.number()), entryId: z.string().pipe(z.coerce.number()) }).parse,
  )

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const drizzle = useDrizzle()

  await drizzle.delete(tables.calcEntry).where(
    and(
      eq(tables.calcEntry.calcId, calcId),
      eq(tables.calcEntry.id, entryId),
      exists(
        drizzle
          .select()
          .from(tables.calc)
          .where(and(eq(tables.calc.createdById, githubId), eq(tables.calcEntry.calcId, tables.calc.id))),
      ),
    ),
  )

  setResponseStatus(event, 204)
})
