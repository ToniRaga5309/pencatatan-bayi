// API untuk verifikasi semua data pending yang belum didownload (bulk verify)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { ensureSchemaSynced } from "@/lib/schema-sync"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    await ensureSchemaSynced()

    // Find all undownloaded pending records
    const pendingRecords = await db.birthRecord.findMany({
      where: {
        isDeleted: false,
        status: "PENDING",
        downloadedAt: null,
      },
      select: { id: true },
    })

    if (pendingRecords.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data pending yang perlu diverifikasi" },
        { status: 400 }
      )
    }

    const recordIds = pendingRecords.map((r) => r.id)

    // Bulk verify all undownloaded pending records
    const result = await db.birthRecord.updateMany({
      where: {
        id: { in: recordIds },
      },
      data: {
        status: "VERIFIED",
        verifiedBy: user.id,
        verifiedAt: new Date(),
      },
    })

    const count = result.count

    // Audit log (fire-and-forget)
    createAuditLog({
      userId: user.id,
      action: "VERIFY",
      entity: "BirthRecord",
      details: {
        totalRecords: count,
        type: "BULK_VERIFY_NEW",
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: `Berhasil memverifikasi ${count} data`,
      count,
    })
  } catch (error) {
    console.error("Error bulk verifying birth records:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: message },
      { status: 500 }
    )
  }
}
