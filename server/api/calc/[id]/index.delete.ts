import z from 'zod'
import { customNanoId } from '#shared/types/calc'

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(event, z.object({ id: customNanoId }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const res = await usePrisma(event).calc.deleteMany({
    where: { publicId, createdById: githubId },
  })
  if (res.count === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  setResponseStatus(event, 204)
})
