// Service untuk mencatat audit log

import { db } from "./db"

// Tipe untuk action audit
export type AuditAction = 
  | "LOGIN" 
  | "LOGOUT" 
  | "CREATE" 
  | "UPDATE" 
  | "DELETE" 
  | "VERIFY" 
  | "REJECT" 
  | "EXPORT" 
  | "VIEW"

// Tipe untuk entity audit
export type AuditEntity = "BirthRecord" | "User" | "Puskesmas" | "Auth"

interface AuditLogData {
  userId: string
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Mencatat aktivitas ke audit log
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    await db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      }
    })
  } catch (error) {
    // Jangan throw error, cukup log ke console
    console.error("Error creating audit log:", error)
  }
}

/**
 * Mendapatkan audit logs dengan pagination
 */
export async function getAuditLogs(options: {
  skip?: number
  take?: number
  userId?: string
  action?: string
  entity?: string
  startDate?: Date
  endDate?: Date
}) {
  const where: Record<string, unknown> = {}

  if (options.userId) {
    where.userId = options.userId
  }

  if (options.action) {
    where.action = options.action
  }

  if (options.entity) {
    where.entity = options.entity
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) {
      (where.createdAt as Record<string, Date>).gte = options.startDate
    }
    if (options.endDate) {
      (where.createdAt as Record<string, Date>).lte = options.endDate
    }
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            namaLengkap: true,
            role: true,
          }
        }
      }
    }),
    db.auditLog.count({ where })
  ])

  return { logs, total }
}
