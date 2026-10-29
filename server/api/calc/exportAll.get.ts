import { strToU8, zipSync } from 'fflate'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  const dbCalcs = await usePrisma(event).calc.findMany({
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
    where: {
      createdById: githubId,
    },
  })

  const encoded = dbCalcs.map((calc) => ({
    name: calc.name,
    encodedCalc: encodeCalcToString({
      ...calc,
      version: currentCalcVersion,
      entries: calc.entries.map((e) => ({ ...e, notes: e.notes ?? undefined, tags: e.tags.map((t) => t.tag) })),
      tags: new Map(calc.tags.map((t) => [t.tag, t.color])),
    }),
  }))

  const files: Record<string, Uint8Array> = {}
  for (const { name, encodedCalc } of encoded) {
    const baseName = name.replace(/[/\\]/g, '_')
    let filename = `${baseName}.json`
    for (let i = 2; filename in files; i++) {
      filename = `${baseName} (${i}).json`
    }
    files[filename] = strToU8(encodedCalc)
  }

  const res = zipSync(files, { level: 1 })
  return new Response(res, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="work-time-calcs.zip"',
    },
  })
})
