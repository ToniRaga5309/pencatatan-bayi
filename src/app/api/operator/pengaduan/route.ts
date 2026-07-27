// API untuk pengaduan operator (create & list)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { ensureSchemaSynced } from "@/lib/schema-sync"
import { z } from "zod"

const pengaduanSchema = z.object({
  subjek: z.string().min(5, "Subjek minimal 5 karakter").max(200),
  pesan: z.string().min(10, "Pesan minimal 10 karakter"),
  kategori: z.enum(["SISTEM", "DATA", "PROSES", "LAINNYA"]),
  prioritas: z.enum(["RENDAH", "SEDANG", "TINGGI"]).default("SEDANG"),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "OPERATOR") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    await ensureSchemaSynced()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const kategori = searchParams.get("kategori") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { userId: user.id }
    if (status) where.status = status
    if (kategori) where.kategori = kategori

    const [records, total] = await Promise.all([
      db.pengaduan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.pengaduan.count({ where }),
    ])

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching pengaduan:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "OPERATOR") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    await ensureSchemaSynced()

    const body = await request.json()
    const parsed = pengaduanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const pengaduan = await db.pengaduan.create({
      data: {
        userId: user.id,
        subjek: data.subjek,
        pesan: data.pesan,
        kategori: data.kategori,
        prioritas: data.prioritas,
        status: "TERBUKA",
      },
    })

    // Audit log (fire and forget)
    db.auditLog
      .create({
        data: {
          userId: user.id,
          action: "CREATE",
          entity: "Pengaduan",
          entityId: pengaduan.id,
          details: JSON.stringify({ subjek: data.subjek, kategori: data.kategori }),
        },
      })
      .catch(() => {})

    return NextResponse.json({ success: true, data: pengaduan })
  } catch (error) {
    console.error("Error creating pengaduan:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}
