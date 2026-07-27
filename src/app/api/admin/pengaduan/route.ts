// API untuk admin mengelola pengaduan (list)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { ensureSchemaSynced } from "@/lib/schema-sync"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    await ensureSchemaSynced()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const kategori = searchParams.get("kategori") || ""
    const prioritas = searchParams.get("prioritas") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "15")
    const skip = (page - 1) * limit

    const where: Prisma.PengaduanWhereInput = {}
    if (status) where.status = status
    if (kategori) where.kategori = kategori
    if (prioritas) where.prioritas = prioritas
    if (search) {
      where.OR = [
        { subjek: { contains: search, mode: "insensitive" } },
        { pesan: { contains: search, mode: "insensitive" } },
        { user: { namaLengkap: { contains: search, mode: "insensitive" } } },
        { user: { username: { contains: search, mode: "insensitive" } } },
      ]
    }

    const [records, total, stats] = await Promise.all([
      db.pengaduan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
      }),
      db.pengaduan.count({ where }),
      db.pengaduan.groupBy({
        by: ["status"],
        _count: true,
      }),
    ])

    const statusCounts: Record<string, number> = {
      TERBUKA: 0,
      DIPROSES: 0,
      SELESAI: 0,
      DITUTUP: 0,
    }
    for (const s of stats) {
      statusCounts[s.status] = s._count
    }

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusCounts,
    })
  } catch (error) {
    console.error("Error fetching admin pengaduan:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}
