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

  const e = await readValidatedBody(event, calcEntry.parse)
  const drizzle = useDrizzle()

  const res = await drizzle
    .insert(tables.calcEntry)
    .values({
      calcId,
      name: e.name,
      from: e.from,
      to: e.to,
      subtractedTime: e.subtractedTime,
      useSubtractedTime: e.customSubtractedTime ?? false,
      isTracking: e.isTracking ?? false,
      notes: e.notes ?? null,
      idx: e.idx ?? 0,
    })
    .returning({ id: tables.calcEntry.id })

  setResponseStatus(event, 201)

  return { id: res[0].id }
})
