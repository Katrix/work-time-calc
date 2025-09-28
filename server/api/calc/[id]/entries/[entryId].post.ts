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

  const e = await readValidatedBody(event, calcEntry.parse)
  const drizzle = useDrizzle()

  await drizzle
    .update(tables.calcEntry)
    .set({
      calcId,
      name: e.name,
      from: e.from,
      to: e.to,
      subtractedTime: e.subtractedTime,
      useSubtractedTime: e.customSubtractedTime,
      isTracking: e.isTracking ?? false,
      notes: e.notes ?? null,
      idx: e.idx ?? 0,
    })
    .where(
      and(
        eq(tables.calcEntry.id, entryId),
        eq(tables.calcEntry.calcId, calcId),
        exists(
          drizzle
            .select()
            .from(tables.calc)
            .where(and(eq(tables.calc.createdById, githubId), eq(tables.calcEntry.calcId, tables.calc.id))),
        ),
      ),
    )

  setResponseStatus(event, 204)

  return {}
})
