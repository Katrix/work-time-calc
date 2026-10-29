export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  return await usePrisma(event).calcTag.findMany({
    select: {
      tag: true,
      color: true,
      calc: {
        select: {
          publicId: true,
          name: true,
        }
      },
      entryTags: {
        select: {
          entry: {
            select: {
              name: true,
              notes: true
            }
          }
        }
      }
    },
    where: {
      calc: {
        createdById: githubId
      },
      sharedTagId: null
    }
  })
})
