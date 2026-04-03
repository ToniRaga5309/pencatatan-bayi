// API untuk menolak data kelahiran (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"

const rejectSchema = z.object({
  alasanPenolakan: z.string().min(5, "Alasan penolakan minimal 5 karakter")
})

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

    // Parse body
    const body = await request.json()
    const validationResult = rejectSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
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

    // Update status ke REJECTED
    const updatedRecord = await db.birthRecord.update({
      where: { id },
      data: {
        status: "REJECTED",
        alasanPenolakan: validationResult.data.alasanPenolakan,
        verifiedBy: user.id,
        verifiedAt: new Date()
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "REJECT",
      entity: "BirthRecord",
      entityId: id,
      details: {
        namaBayi: record.namaBayi,
        puskesmasId: record.puskesmasId,
        alasanPenolakan: validationResult.data.alasanPenolakan
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({
      success: true,
      message: "Data berhasil ditolak",
      data: updatedRecord
    })
  } catch (error) {
    console.error("Error rejecting birth record:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
