// API endpoint untuk menghapus semua audit log
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { getClientIp } from "@/lib/utils-common"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }

    const ip = getClientIp(request.headers)

    // Buat satu audit log sebelum menghapus (ini akan tetap tersimpan)
    const auditLog = await db.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        entity: "System",
        details: JSON.stringify({
          action: "CLEAR_AUDIT_LOGS",
          message: "Admin menghapus semua audit log",
          clearedBy: user.namaLengkap
        }),
        ipAddress: ip
      }
    })

    // Hitung total yang akan dihapus (tidak termasuk yang baru dibuat)
    const countBeforeDelete = await db.auditLog.count({
      where: {
        id: { not: auditLog.id }
      }
    })

    // Hapus semua audit log kecuali yang baru dibuat
    await db.auditLog.deleteMany({
      where: {
        id: { not: auditLog.id }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${countBeforeDelete} audit log`,
      deletedCount: countBeforeDelete,
      remainingLogId: auditLog.id
    })
  } catch (error) {
    console.error("Error clearing audit logs:", error)
    return NextResponse.json(
      { error: "Gagal menghapus audit log" },
      { status: 500 }
    )
  }
}
