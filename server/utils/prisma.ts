import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '../generated/prisma/client'
import { type H3Event } from 'h3'
import type { D1Database } from '@cloudflare/workers-types'

export function usePrisma(event: H3Event): PrismaClient {
  const adapter = new PrismaD1(event.context.cloudflare.env.DB as D1Database)
  return new PrismaClient({ adapter, log: ['info', 'warn'] })
}
