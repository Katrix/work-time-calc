import z from 'zod'

export default defineEventHandler(async (event) => {
  const { id: publicId, rank } = await getValidatedRouterParams(
    event,
    z.object({ id: z.nanoid(), rank: z.string() }).parse,
  )

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const e = await readValidatedBody(event, calcEntryV2Schema.parse)

  const prisma = usePrisma(event)
  const calcId = await prisma.calc.findUnique({ where: { publicId, createdById: githubId }, select: { id: true } })
  if (!calcId) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  await prisma.calcEntry.update({
    where: {
      calcId_rank: {
        calcId: calcId.id,
        rank,
      },
    },
    data: {
      name: e.name,
      from: e.from,
      to: e.to,
      subtractedTime: e.subtractedTime,
      isTracking: e.isTracking ?? false,
      notes: e.notes ?? null,
      rank: e.rank,
      tags: {
        deleteMany: {
          NOT: {
            tag: {
              in: e.tags,
            },
          },
        },
        create: e.tags?.map((tag) => ({
          calcTag: {
            connect: {
              calcId_tag: {
                calcId: calcId.id,
                tag,
              },
            },
          },
        })),
      },
    },
  })

  setResponseStatus(event, 204)
})
