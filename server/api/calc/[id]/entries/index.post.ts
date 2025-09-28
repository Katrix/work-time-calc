import z from 'zod'
import { nanoid } from 'nanoid'

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(event, z.object({ id: z.nanoid() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const e = await readValidatedBody(event, calcEntryV2Schema.parse)

  const prisma = usePrisma(event)
  const calcId = await prisma.calc.findUnique({ where: { publicId }, select: { id: true } })
  if (!calcId) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  await prisma.calcEntry.create({
    data: {
      name: e.name,
      from: e.from,
      to: e.to,
      subtractedTime: e.subtractedTime,
      isTracking: e.isTracking ?? false,
      notes: e.notes ?? null,
      rank: e.rank,
      calc: {
        connect: {
          publicId,
        },
      },
      tags: {
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

  setResponseStatus(event, 201)
})
