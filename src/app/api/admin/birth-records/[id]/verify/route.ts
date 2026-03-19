// API untuk verifikasi data kelahiran (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Cek data
    const record = await db.birthRecord.findFirst({
      where: { id, isDeleted: false }
    })

    if (!record) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    if (record.status !== "PENDING") {
      return NextResponse.json(
        { error: "Data sudah diproses sebelumnya" },
        { status: 400 }
      )
    }

    // Update status ke VERIFIED
    const updatedRecord = await db.birthRecord.update({
      where: { id },
      data: {
        status: "VERIFIED",
        verifiedBy: user.id,
        verifiedAt: new Date()
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "VERIFY",
      entity: "BirthRecord",
      entityId: id,
      details: {
        namaBayi: record.namaBayi,
        puskesmasId: record.puskesmasId
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({
      success: true,
      message: "Data berhasil diverifikasi",
      data: updatedRecord
    })
  } catch (error) {
    console.error("Error verifying birth record:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
