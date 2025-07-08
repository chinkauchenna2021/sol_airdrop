import  PrismaClient  from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient.PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma