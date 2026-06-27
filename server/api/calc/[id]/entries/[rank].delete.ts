import z from 'zod'
import { customNanoId } from '#shared/types/calc'

export default defineEventHandler(async (event) => {
  const { id: publicId, rank } = await getValidatedRouterParams(
    event,
    z.object({ id: customNanoId, rank: z.string() }).parse,
  )

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const prisma = usePrisma(event)
  await prisma.calcEntry.deleteMany({
    where: { rank, calc: { createdById: githubId, publicId } },
  })
  await prisma.calc.update({ data: { updatedAt: new Date() }, where: { publicId } })

  setResponseStatus(event, 204)
})
