import z from 'zod'
import type { PrismaClient } from '#server/generated/prisma/client.ts'

const toLinkSchema = z.object({ publicCalcId: customNanoId, tag: z.string() })
type ToLink = z.infer<typeof toLinkSchema>
type ToLinkWithId = ToLink & { calcId: number }

async function partitionLinkRequests(
  prisma: PrismaClient,
  sharedTag: { id: number; name: string; color: string },
  toLink: ToLinkWithId[],
) {
  const toMergeIntoCalcIds = await prisma.calcTag.findMany({
    select: {
      calcId: true,
    },
    where: {
      tag: sharedTag.name,
      calcId: {
        in: toLink.map((tagToLink) => tagToLink.calcId),
      },
    },
  })
  const mergeIntoCalcIds = new Set(toMergeIntoCalcIds.map((mergeInto) => mergeInto.calcId))
  const toMergeInto = toLink.filter((tagToLink) => mergeIntoCalcIds.has(tagToLink.calcId))
  const withoutMergeInto = toLink.filter((tagToLink) => !mergeIntoCalcIds.has(tagToLink.calcId))

  const seenCalcIds = new Set<number>()
  const duplicatedCalcIds = new Set<number>()
  for (const tagToLink of withoutMergeInto) {
    if (seenCalcIds.has(tagToLink.calcId)) {
      duplicatedCalcIds.add(tagToLink.calcId)
    }

    seenCalcIds.add(tagToLink.calcId)
  }

  const toMergeTogether = withoutMergeInto.filter((tagToLink) => duplicatedCalcIds.has(tagToLink.calcId))
  const withoutMerges = withoutMergeInto.filter((tagToLink) => !duplicatedCalcIds.has(tagToLink.calcId))

  return { toMergeInto, toMergeTogether, withoutMerges }
}

// We're expecting a lot of entries for linking, so we need to make sure we don't hit D1's prepared arguments limit
async function batchQueries<A>(toLink: A[], run: (batch: A[]) => Promise<void>, batchSize = 40) {
  for (let i = 0; i < toLink.length; i += batchSize) {
    await run(toLink.slice(i, i + batchSize))
  }
}

async function handleMerge(
  prisma: PrismaClient,
  sharedTag: { id: number; name: string; color: string },
  toLink: ToLinkWithId[],
) {
  const toMerge = toLink.filter((tagToLink) => tagToLink.tag !== sharedTag.name)

  const entriesToCreateFor = new Map<number, { calcId: number; entryId: number }>()
  await batchQueries(toMerge, async (batch) => {
    const entries = await prisma.calcEntryTag.findMany({
      select: {
        calcId: true,
        entryId: true,
      },
      where: {
        OR: batch.map((tagToLink) => ({ tag: tagToLink.tag, calcId: tagToLink.calcId })),
        entry: { tags: { none: { tag: sharedTag.name } } },
      },
    })

    // Deduplicate entries
    for (const entry of entries) {
      entriesToCreateFor.set(entry.entryId, entry)
    }
  })

  await prisma.calcEntryTag.createMany({
    data: [...entriesToCreateFor.values()].map((entry) => ({
      entryId: entry.entryId,
      tag: sharedTag.name,
      calcId: entry.calcId,
    })),
  })

  await batchQueries(toMerge, async (batch) => {
    await prisma.calcTag.deleteMany({
      where: {
        OR: batch.map((tagToLink) => ({ tag: tagToLink.tag, calcId: tagToLink.calcId })),
      },
    })
  })
}

async function handleMergeInto(
  prisma: PrismaClient,
  sharedTag: { id: number; name: string; color: string },
  toLink: ToLinkWithId[],
) {
  await handleMerge(prisma, sharedTag, toLink)

  const calcIds = [...new Set(toLink.map((tagToLink) => tagToLink.calcId))]
  await prisma.calcTag.updateMany({
    data: {
      color: sharedTag.color,
      sharedTagId: sharedTag.id,
    },
    where: {
      tag: sharedTag.name,
      calcId: {
        in: calcIds,
      },
    },
  })
}

async function handleMergeTogether(
  prisma: PrismaClient,
  sharedTag: { id: number; name: string; color: string },
  toLink: ToLinkWithId[],
) {
  const calcIds = [...new Set(toLink.map((tagToLink) => tagToLink.calcId))]
  await prisma.calcTag.createMany({
    data: calcIds.map((calcId) => ({
      calcId,
      tag: sharedTag.name,
      color: sharedTag.color,
      sharedTagId: sharedTag.id,
    })),
  })

  await handleMerge(prisma, sharedTag, toLink)
}

async function handleNoMerges(
  prisma: PrismaClient,
  sharedTag: { id: number; name: string; color: string },
  toLink: ToLinkWithId[],
) {
  await batchQueries(toLink, async (batch) => {
    await prisma.calcTag.updateMany({
      data: {
        tag: sharedTag.name,
        color: sharedTag.color,
        sharedTagId: sharedTag.id,
      },
      where: {
        OR: batch.map((tagToLink) => ({ tag: tagToLink.tag, calcId: tagToLink.calcId })),
      },
    })
  })
}

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(event, z.object({ id: customNanoId }).parse)

  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  const toLink = await readValidatedBody(event, z.array(toLinkSchema).parse)

  const prisma = usePrisma(event)

  const res = await prisma.calc.findMany({
    select: {
      id: true,
      publicId: true,
    },
    where: {
      publicId: {
        in: toLink.map((t) => t.publicCalcId),
      },
      createdById: githubId,
    },
  })
  if (res.length !== new Set(toLink.map((t) => t.publicCalcId)).size) {
    throw createError({ statusCode: 400, statusMessage: 'Some of the calcs are not yours' })
  }

  const toLinkWithIds = toLink.map((t) => ({
    ...t,
    calcId: res.find((r) => r.publicId === t.publicCalcId)!.id,
  }))

  const sharedTag = await prisma.sharedTag.findUnique({
    where: {
      publicId,
      createdById: githubId,
    },
    select: {
      id: true,
      name: true,
      color: true,
    },
  })
  if (!sharedTag) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  const { toMergeInto, toMergeTogether, withoutMerges } = await partitionLinkRequests(prisma, sharedTag, toLinkWithIds)

  await Promise.all([
    handleMergeInto(prisma, sharedTag, toMergeInto),
    handleMergeTogether(prisma, sharedTag, toMergeTogether),
    handleNoMerges(prisma, sharedTag, withoutMerges),
  ])

  setResponseStatus(event, 204)
})
