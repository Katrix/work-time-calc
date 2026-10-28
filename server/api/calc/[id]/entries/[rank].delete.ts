import z from 'zod'
import { customNanoId } from '#shared/types/calc'

export default defineEventHandler(async (event) => {
  const { id: publicId, rank } = await getValidatedRouterParams(
    event,
    z.object({ id: customNanoId, rank: z.string() }).parse,
  )

  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  const prisma = usePrisma(event)
  const res = await prisma.calcEntry.deleteMany({
    where: { rank, calc: { createdById: githubId, publicId } },
  })
  if (res.count === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  await prisma.calc.update({ data: { updatedAt: new Date() }, where: { createdById: githubId, publicId } })

  setResponseStatus(event, 204)
})
