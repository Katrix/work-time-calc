import z from 'zod'
import { customNanoId } from '#shared/types/calc'

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(event, z.object({ id: customNanoId }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const es = await readValidatedBody(event, calcEntryV2Schema.array().parse)

  const prisma = usePrisma(event)
  const calcId = await prisma.calc.findUnique({ where: { publicId, createdById: githubId }, select: { id: true } })
  if (!calcId) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  await prisma.calc.update({
    where: {
      id: calcId.id,
    },
    data: {
      updatedAt: new Date(),
      entries: {
        deleteMany: {
          calcId: calcId.id,
        },
        create: es.map((e) => ({
          name: e.name,
          from: e.from,
          to: e.to,
          subtractedTime: e.subtractedTime,
          isTracking: e.isTracking ?? false,
          notes: e.notes ?? null,
          rank: e.rank,
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
        })),
      },
    },
  })

  await setPresetsUpdatedNow(event, githubId)
})
