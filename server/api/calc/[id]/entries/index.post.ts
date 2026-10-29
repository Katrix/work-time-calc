import z from 'zod'
import { customNanoId } from '#shared/types/calc'

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(event, z.object({ id: customNanoId }).parse)

  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  const e = await readValidatedBody(event, calcEntryV2Schema.parse)

  const prisma = usePrisma(event)
  const calcId = await prisma.calc.findUnique({ where: { publicId, createdById: githubId }, select: { id: true } })
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
            connectOrCreate: {
              where: {
                calcId_tag: {
                  calcId: calcId.id,
                  tag,
                },
              },
              create: {
                calcId: calcId.id,
                tag,
                color: randomColor(),
              },
            },
          },
        })),
      },
    },
  })
  await prisma.calc.update({ data: { updatedAt: new Date() }, where: { id: calcId.id } })

  setResponseStatus(event, 201)
})
