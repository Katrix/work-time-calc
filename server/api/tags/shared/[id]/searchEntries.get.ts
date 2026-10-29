import z from 'zod'

interface CalcData {
  publicId: string
  name: string
  tags: Record<string, { color: string; sharedTagId: string | null }>
  entries: CalcEntry[]
}

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(event, z.object({ id: customNanoId }).parse)

  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  const filters = await getValidatedQuery(
    event,
    z.object({ before: z.iso.date().optional(), after: z.iso.date().optional() }).parse,
  )

  const entries = await usePrisma(event).calcEntry.findMany({
    where: {
      tags: {
        some: {
          calcTag: {
            sharedTag: {
              publicId,
              createdById: githubId,
            },
          },
        },
      },
      calc: {
        createdById: githubId,
        name: {
          // Purely relying on the fact that ISO dates are sorted lexicographically
          // We should filter out the ones that aren't actually dates in code
          gt: filters.after,
          lt: filters.before,
        },
      },
    },
    include: {
      tags: true,
      calc: {
        select: {
          publicId: true,
          name: true,
          tags: {
            select: {
              tag: true,
              color: true,
              sharedTag: {
                select: {
                  publicId: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const calcData = new Map<string, CalcData>()
  for (const entry of entries) {
    const calc = entry.calc
    if ((filters.before !== undefined || filters.after !== undefined) && isNaN(Date.parse(calc.name))) {
      continue
    }

    const encoded = calcEntryV2Schema.encode({
      ...entry,
      notes: entry.notes ?? undefined,
      tags: entry.tags.map((t) => t.tag),
    })

    let data = calcData.get(calc.publicId)
    if (!data) {
      data = {
        publicId: calc.publicId,
        name: calc.name,
        tags: Object.fromEntries(
          calc.tags.map((tag) => [
            tag.tag,
            {
              color: tag.color,
              sharedTagId: tag.sharedTag?.publicId ?? null,
            },
          ]),
        ),
        entries: [],
      }
      calcData.set(calc.publicId, data)
    }

    data.entries.push(encoded)
  }

  return [...calcData.values()]
})
