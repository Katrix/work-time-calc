import { strToU8, zipSync } from 'fflate'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  // Fetch each table separately using relation filters instead of `include`. Prisma resolves
  // `include` with `IN (...)` queries binding one parameter per parent row, which exceeds D1's
  // 100 bound parameter limit for users with many entries.
  const prisma = usePrisma(event)
  const [dbCalcs, dbCalcTags, dbEntries, dbEntryTags] = await Promise.all([
    prisma.calc.findMany({ where: { createdById: githubId } }),
    prisma.calcTag.findMany({ where: { calc: { createdById: githubId } } }),
    prisma.calcEntry.findMany({ where: { calc: { createdById: githubId } }, orderBy: { rank: 'asc' } }),
    prisma.calcEntryTag.findMany({ where: { entry: { calc: { createdById: githubId } } } }),
  ])

  const tagsByEntry = Map.groupBy(dbEntryTags, (t) => t.entryId)
  const entriesByCalc = Map.groupBy(dbEntries, (e) => e.calcId)
  const tagsByCalc = Map.groupBy(dbCalcTags, (t) => t.calcId)

  const encoded = dbCalcs.map((calc) => ({
    name: calc.name,
    encodedCalc: encodeCalcToString({
      ...calc,
      version: currentCalcVersion,
      entries: (entriesByCalc.get(calc.id) ?? []).map((e) => ({
        ...e,
        notes: e.notes ?? undefined,
        tags: (tagsByEntry.get(e.id) ?? []).map((t) => t.tag),
      })),
      tags: new Map((tagsByCalc.get(calc.id) ?? []).map((t) => [t.tag, t.color])),
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
