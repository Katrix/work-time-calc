import z from 'zod'
import { calcWithEntriesV2Schema, customNanoId } from '#shared/types/calc'

const calcWithEntriesWithUpdatedAt = calcWithEntriesV2Schema.extend({ updatedAt: z.date() })

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(event, z.object({ id: customNanoId }).parse)

  const session = await requireUserSession(event)
  const githubId = session.user.githubId

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
        orderBy: {
          rank: 'asc',
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

  return calcWithEntriesWithUpdatedAt.encode(calc)
})
