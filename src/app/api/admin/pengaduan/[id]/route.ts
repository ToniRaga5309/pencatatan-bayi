// API untuk admin membalas & update status pengaduan
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { ensureSchemaSynced } from "@/lib/schema-sync"
import { z } from "zod"

const updateSchema = z.object({
  balasan: z.string().min(1, "Balasan tidak boleh kosong").max(5000).optional(),
  status: z.enum(["TERBUKA", "DIPROSES", "SELESAI", "DITUTUP"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    await ensureSchemaSynced()

    const { id } = await params

    const pengaduan = await db.pengaduan.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            username: true,
            puskesmas: { select: { nama: true } },
          },
        },
      },
    })

    if (!pengaduan) {
      return NextResponse.json({ error: "Pengaduan tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ data: pengaduan })
  } catch (error) {
    console.error("Error fetching pengaduan detail:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    await ensureSchemaSynced()

    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existing = await db.pengaduan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Pengaduan tidak ditemukan" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.balasan !== undefined) {
      updateData.balasan = data.balasan
      updateData.balasanOleh = user.id
      updateData.balasanPada = new Date()
      // Auto-set status to DIPROSES if currently TERBUKA
      if (existing.status === "TERBUKA") {
        updateData.status = "DIPROSES"
      }
    }
    if (data.status !== undefined) {
      updateData.status = data.status
      // If status is SELESAI or DITUTUP, set balasanPada if not set
      if ((data.status === "SELESAI" || data.status === "DITUTUP") && !existing.balasanPada) {
        updateData.balasanPada = new Date()
      }
    }

    const updated = await db.pengaduan.update({
      where: { id },
      data: updateData,
    })

    db.auditLog
      .create({
        data: {
          userId: user.id,
          action: "UPDATE",
          entity: "Pengaduan",
          entityId: id,
          details: JSON.stringify({
            status: data.status,
            hasReply: !!data.balasan,
          }),
        },
      })
      .catch(() => {})

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Error updating pengaduan:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}
