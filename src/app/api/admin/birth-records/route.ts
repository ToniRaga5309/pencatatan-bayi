// API untuk mengambil semua data kelahiran (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const puskesmasId = searchParams.get("puskesmasId") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "15")
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = { isDeleted: false }

    if (status && ["PENDING", "VERIFIED", "REJECTED"].includes(status)) {
      where.status = status
    }

    if (puskesmasId) {
      where.puskesmasId = puskesmasId
    }

    if (search) {
      where.OR = [
        { namaBayi: { contains: search } },
        { nikIbu: { contains: search } },
        { namaIbu: { contains: search } }
      ]
    }

    const [records, total] = await Promise.all([
      db.birthRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          puskesmas: { select: { nama: true } },
          creator: { select: { namaLengkap: true } }
        }
      }),
      db.birthRecord.count({ where })
    ])

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching admin birth records:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
