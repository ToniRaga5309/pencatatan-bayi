// Database client untuk Prisma
// Menggunakan driver adapter untuk serverless (Vercel + Supabase)
// Menggunakan singleton pattern untuk mencegah multiple connections

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || ""

  // Gunakan driver adapter untuk PostgreSQL (Vercel/Supabase production)
  // Driver adapter mengelola connection pool secara efisien di lingkungan serverless
  if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
    const adapter = new PrismaPg({
      connectionString: databaseUrl,
      // Timeout untuk koneksi di serverless environment
      max: 5, // Maksimal 5 koneksi per instance
      idleTimeoutMillis: 10000, // 10 detik idle timeout
      connectionTimeoutMillis: 15000, // 15 detik connection timeout
    })
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    })
  }

  // Standard client untuk development lokal (SQLite)
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
