import z from 'zod'

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(event, z.object({ id: z.nanoid() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const res = await usePrisma(event).calc.findUnique({
    where: {
      publicId,
      createdById: githubId,
    },
    include: {
      entries: {
        include: {
          tags: true,
        },
      },
      tags: true,
    },
  })

  if (!res) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  const calc: CalcWithEntries & { updatedAt: Date } = {
    ...res,
    version: currentCalcVersion,
    entries: res.entries.map((e) => ({ ...e, notes: e.notes ?? undefined, tags: e.tags.map((t) => t.tag) })),
    tags: new Map(res.tags.map((t) => [t.tag, t.color])),
  }

  return calc
})
