import 'server-only'

import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export function getPrisma() {
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient()
  }

  return globalThis.prisma
}
